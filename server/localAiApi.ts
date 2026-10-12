import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const MANUS_API_URL = 'https://api.manus.ai'
const FAL_QUEUE_URL = 'https://queue.fal.run'
const MAX_BODY_BYTES = 15 * 1024 * 1024
const IMAGE_URL_HOSTS = new Set(['images.unsplash.com'])

type LocalEnv = Record<string, string>

type MarketingCampaign = {
  concept: string
  targetAudience: string
  imagePrompts: string[]
  videoPrompt: string
  headline: string
  productDescription: string
}

type FalGenerationRequest = {
  model?: unknown
  type?: unknown
  prompt?: unknown
  image?: unknown
}

type FalGenerationRecord = {
  requestId: string
  model: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  statusUrl: string
  responseUrl: string
  outputs?: unknown
  errorMessage?: string
}

class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const marketingSchema = {
  type: 'object',
  properties: {
    concept: {
      type: 'string',
      description: 'A concise advertising concept for the selected product.',
    },
    targetAudience: {
      type: 'string',
      description: 'The primary target audience and why it fits.',
    },
    imagePrompts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Exactly three distinct prompts for advertising images.',
    },
    videoPrompt: {
      type: 'string',
      description: 'One detailed prompt for an advertising video.',
    },
    headline: {
      type: 'string',
      description: 'A short advertising headline for the product.',
    },
    productDescription: {
      type: 'string',
      description: 'Persuasive advertising copy for the product page.',
    },
  },
  required: [
    'concept',
    'targetAudience',
    'imagePrompts',
    'videoPrompt',
    'headline',
    'productDescription',
  ],
  additionalProperties: false,
}

function sendJson(
  response: ServerResponse,
  status: number,
  data: unknown,
) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(data))
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) {
      throw new ApiError(413, 'Request body exceeds the 15 MB limit.')
    }
    chunks.push(buffer)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new ApiError(400, 'Request body must contain valid JSON.')
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'A JSON object is required.')
  }
  return value as Record<string, unknown>
}

function requireText(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = record[key]
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new ApiError(400, `Invalid or missing "${key}".`)
  }
  return value.trim()
}

function requireImageUrl(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'A product image URL is required.')
  }

  let imageUrl: URL
  try {
    imageUrl = new URL(value)
  } catch {
    throw new ApiError(400, 'Invalid product image URL.')
  }

  if (
    imageUrl.protocol !== 'https:' ||
    !IMAGE_URL_HOSTS.has(imageUrl.hostname)
  ) {
    throw new ApiError(400, 'Product images must use images.unsplash.com.')
  }
  return imageUrl.toString()
}

function apiKey(env: LocalEnv, name: string): string {
  const key = env[name]?.trim()
  if (!key) {
    throw new ApiError(
      503,
      `${name} is missing from the local .env file. Restart the dev server after adding it.`,
    )
  }
  return key
}

async function providerJson<T>(
  url: string,
  key: string,
  provider: 'Manus' | 'fal.ai',
  init: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(provider === 'Manus'
          ? { 'x-manus-api-key': key }
          : { Authorization: `Key ${key}` }),
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(502, `Could not connect to ${provider}.`)
  }

  const responseText = await response.text()
  let payload: unknown
  try {
    payload = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new ApiError(502, `${provider} returned an invalid response.`)
  }

  if (!response.ok) {
    const record =
      payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>)
        : {}
    const providerError =
      record.error && typeof record.error === 'object'
        ? (record.error as Record<string, unknown>).message
        : undefined
    const detail =
      typeof providerError === 'string'
        ? providerError
        : responseText.slice(0, 800)
    throw new ApiError(
      response.status === 401 || response.status === 403
        ? 502
        : response.status,
      `${provider} returned ${response.status}${detail ? `: ${detail}` : ''}`,
    )
  }

  return payload as T
}

function validateCampaign(value: unknown): MarketingCampaign {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(502, 'Manus returned an invalid campaign result.')
  }
  const result = value as Record<string, unknown>
  const textFields = [
    'concept',
    'targetAudience',
    'videoPrompt',
    'headline',
    'productDescription',
  ] as const

  for (const field of textFields) {
    if (typeof result[field] !== 'string' || !result[field].trim()) {
      throw new ApiError(502, `Manus omitted "${field}" from its response.`)
    }
  }
  if (
    !Array.isArray(result.imagePrompts) ||
    result.imagePrompts.length !== 3 ||
    result.imagePrompts.some(
      (prompt) => typeof prompt !== 'string' || !prompt.trim(),
    )
  ) {
    throw new ApiError(
      502,
      'Manus must return exactly three image prompts.',
    )
  }

  return {
    concept: result.concept as string,
    targetAudience: result.targetAudience as string,
    imagePrompts: result.imagePrompts as string[],
    videoPrompt: result.videoPrompt as string,
    headline: result.headline as string,
    productDescription: result.productDescription as string,
  }
}

async function createMarketingCampaign(
  body: unknown,
  env: LocalEnv,
): Promise<MarketingCampaign> {
  const values = requireRecord(body)
  const product = requireRecord(values.product)
  const name = requireText(product, 'name', 200)
  const description = requireText(product, 'description', 3000)
  const category = requireText(product, 'category', 100)
  const goal = requireText(values, 'goal', 1000)
  const imageUrl = requireImageUrl(product.image)
  const key = apiKey(env, 'MANUS_API_KEY')

  const instruction = [
    'Create an advertising campaign for the product described below.',
    'Analyze the attached product image and use it as visual context. Do not invent product features that are not stated.',
    'Write every field in English. Make image and video prompts ready to paste into a generative image/video model.',
    'Return exactly three distinct image prompts and one video prompt.',
    `Product name: ${name}`,
    `Category: ${category}`,
    `Product description: ${description}`,
    `Campaign goal: ${goal}`,
  ].join('\n\n')

  const created = await providerJson<{
    task_id?: unknown
  }>(`${MANUS_API_URL}/v2/task.create`, key, 'Manus', {
    method: 'POST',
    body: JSON.stringify({
      title: `ShopGenie campaign: ${name}`.slice(0, 200),
      message: {
        content: [
          { type: 'text', text: instruction },
          {
            type: 'file',
            file_url: imageUrl,
            filename: `${name.replace(/[^a-zA-Z0-9_-]/g, '-')}-product.jpg`,
            mime_type: 'image/jpeg',
          },
        ],
      },
      locale: 'en',
      interactive_mode: false,
      hide_in_task_list: true,
      share_visibility: 'private',
      agent_profile: 'lite',
      structured_output_schema: marketingSchema,
    }),
  })

  if (typeof created.task_id !== 'string' || !created.task_id) {
    throw new ApiError(502, 'Manus did not return a task ID.')
  }

  const taskId = created.task_id
  const deadline = Date.now() + 240_000
  let observedStatus: string | undefined

  while (Date.now() < deadline) {
    const messages = await providerJson<{
      messages?: Array<Record<string, unknown>>
    }>(
      `${MANUS_API_URL}/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}&order=desc&limit=50`,
      key,
      'Manus',
    )

    if (!Array.isArray(messages.messages)) {
      throw new ApiError(502, 'Manus returned an invalid task message list.')
    }

    let pageStatus: string | undefined
    for (const message of messages.messages) {
      if (message.type === 'structured_output_result') {
        const output = message.structured_output_result
        if (output && typeof output === 'object') {
          const result = output as Record<string, unknown>
          if (result.success === true) {
            return validateCampaign(result.value)
          }
          if (result.success === false) {
            throw new ApiError(
              502,
              'Manus could not format the campaign response.',
            )
          }
        }
      }

      if (message.type === 'status_update' && message.status_update) {
        const update = message.status_update as Record<string, unknown>
        if (pageStatus === undefined && typeof update.agent_status === 'string') {
          pageStatus = update.agent_status
        }
      }

      if (message.type === 'error_message' && message.error_message) {
        const error = message.error_message as Record<string, unknown>
        throw new ApiError(
          502,
          typeof error.message === 'string'
            ? error.message
            : 'Manus reported a task error.',
        )
      }
    }

    observedStatus = pageStatus ?? observedStatus

    if (observedStatus === 'error') {
      throw new ApiError(502, 'The Manus task failed.')
    }
    if (observedStatus === 'waiting') {
      throw new ApiError(
        502,
        'Manus paused and needs input; try regenerating the campaign.',
      )
    }

    if (observedStatus === 'stopped') {
      const detail = await providerJson<{
        task?: { has_running_background_jobs?: unknown }
      }>(
        `${MANUS_API_URL}/v2/task.detail?task_id=${encodeURIComponent(taskId)}`,
        key,
        'Manus',
      )
      if (detail.task?.has_running_background_jobs === false) {
        throw new ApiError(
          502,
          'Manus finished without returning the requested structured campaign.',
        )
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new ApiError(
    504,
    'Manus is still working. Please try generating the campaign again.',
  )
}

function validateFalQueueUrl(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ApiError(400, 'Invalid fal.ai queue URL.')
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new ApiError(400, 'Invalid fal.ai queue URL.')
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.fal.run')) {
    throw new ApiError(400, 'Untrusted fal.ai queue URL.')
  }
  return url.toString()
}

function imageDataUrl(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string' && value.startsWith('https://')) {
    const imageUrl = requireImageUrl(value)
    return imageUrl
  }
  if (
    typeof value !== 'string' ||
    !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value)
  ) {
    throw new ApiError(400, 'Image must be a JPG, PNG, or WebP data URL.')
  }
  return value
}

function isGenerationType(
  value: unknown,
): value is 'text_to_image' | 'image_to_image' | 'text_to_video' | 'image_to_video' {
  return (
    value === 'text_to_image' ||
    value === 'image_to_image' ||
    value === 'text_to_video' ||
    value === 'image_to_video'
  )
}

async function createFalGeneration(
  body: unknown,
  env: LocalEnv,
): Promise<FalGenerationRecord> {
  const values = requireRecord(body) as FalGenerationRequest
  if (
    typeof values.model !== 'string' ||
    !/^[a-zA-Z0-9._/-]{1,200}$/.test(values.model) ||
    values.model.includes('..')
  ) {
    throw new ApiError(400, 'Invalid fal.ai model endpoint ID.')
  }
  if (!isGenerationType(values.type)) {
    throw new ApiError(400, 'Unsupported generation type.')
  }
  if (
    typeof values.prompt !== 'string' ||
    !values.prompt.trim() ||
    values.prompt.length > 5000
  ) {
    throw new ApiError(400, 'Prompt must contain 1 to 5000 characters.')
  }
  const image = imageDataUrl(values.image)
  if (
    (values.type === 'image_to_image' || values.type === 'image_to_video') &&
    !image
  ) {
    throw new ApiError(400, 'Upload an image for this generation type.')
  }

  const key = apiKey(env, 'FAL_AI_API_KEY')
  const submission = await providerJson<{
    request_id?: unknown
    status_url?: unknown
    response_url?: unknown
  }>(`${FAL_QUEUE_URL}/${values.model}`, key, 'fal.ai', {
    method: 'POST',
    body: JSON.stringify({
      prompt: values.prompt.trim(),
      ...(image ? { image_url: image } : {}),
    }),
  })

  if (
    typeof submission.request_id !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(submission.request_id)
  ) {
    throw new ApiError(502, 'fal.ai returned an invalid request ID.')
  }

  return {
    requestId: submission.request_id,
    model: values.model,
    status: 'queued',
    progress: 0,
    statusUrl: validateFalQueueUrl(submission.status_url),
    responseUrl: validateFalQueueUrl(submission.response_url),
  }
}

async function pollFalGeneration(
  body: unknown,
  env: LocalEnv,
): Promise<FalGenerationRecord> {
  const values = requireRecord(body)
  if (
    typeof values.requestId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(values.requestId) ||
    typeof values.model !== 'string'
  ) {
    throw new ApiError(400, 'Invalid fal.ai generation record.')
  }
  const statusUrl = validateFalQueueUrl(values.statusUrl)
  const responseUrl = validateFalQueueUrl(values.responseUrl)
  const key = apiKey(env, 'FAL_AI_API_KEY')
  const status = await providerJson<{
    status?: unknown
    error?: unknown
    progress?: unknown
  }>(statusUrl, key, 'fal.ai')

  const record: FalGenerationRecord = {
    requestId: values.requestId,
    model: values.model,
    status: 'queued',
    progress: 0,
    statusUrl,
    responseUrl,
  }

  if (status.status === 'COMPLETED') {
    record.status = 'completed'
    record.progress = 100
    const output = await providerJson<unknown>(responseUrl, key, 'fal.ai')
    return { ...record, outputs: output }
  }
  if (status.status === 'FAILED') {
    record.status = 'failed'
    record.errorMessage =
      typeof status.error === 'string'
        ? status.error
        : 'fal.ai generation failed.'
    return record
  }
  if (status.status === 'IN_PROGRESS') {
    record.status = 'processing'
    record.progress =
      typeof status.progress === 'number'
        ? Math.max(0, Math.min(99, status.progress))
        : 50
    return record
  }
  if (status.status !== 'IN_QUEUE') {
    throw new ApiError(502, 'fal.ai returned an unknown generation status.')
  }
  return record
}

export function localAiApi(env: LocalEnv): Plugin {
  return {
    name: 'shopgenie-local-ai-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://localhost').pathname
        const route =
          path === '/api/local/manus/concept' ||
          path === '/api/local/fal/generations' ||
          path === '/api/local/fal/generations/poll'

        if (!route) {
          next()
          return
        }

        const host = request.headers.host
        let hostname: string
        try {
          hostname = host ? new URL(`http://${host}`).hostname : ''
        } catch {
          sendJson(response, 403, {
            message: 'The local AI API only accepts requests from this computer.',
          })
          return
        }
        if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)) {
          sendJson(response, 403, {
            message: 'The local AI API only accepts requests from this computer.',
          })
          return
        }

        if (request.method !== 'POST') {
          sendJson(response, 405, { message: 'Use POST for this endpoint.' })
          return
        }

        void (async () => {
          try {
            const body = await readJson(request)
            if (path === '/api/local/manus/concept') {
              sendJson(response, 200, await createMarketingCampaign(body, env))
              return
            }
            if (path === '/api/local/fal/generations') {
              sendJson(response, 202, await createFalGeneration(body, env))
              return
            }
            sendJson(response, 200, await pollFalGeneration(body, env))
          } catch (error) {
            if (error instanceof ApiError) {
              sendJson(response, error.status, { message: error.message })
              return
            }
            console.error('ShopGenie local AI API failed:', error)
            sendJson(response, 500, {
              message: 'The local AI API request failed. Check the Vite terminal.',
            })
          }
        })()
      })
    },
  }
}