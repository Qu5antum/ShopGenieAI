import { useEffect, useState, type ChangeEvent } from 'react'
import {
  createGeneration,
  getGeneration,
  type GenerationRecord,
  type GenerationType,
} from '../services/generationApi'
import { createAdCampaign, type AdCampaign } from '../services/adAgent'
import { products } from '../data/products'

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'failed'
type OutputType = 'image' | 'video'

const generationOptions: Array<{
  type: GenerationType
  title: string
  description: string
  model: string
  output: OutputType
}> = [
  {
    type: 'image_to_video',
    title: 'Image → Video',
    description: 'Bring your product photo to life',
    model: 'fal-ai/kling-video/v2.1/standard/image-to-video',
    output: 'video',
  },
  {
    type: 'text_to_video',
    title: 'Text → Video',
    description: 'Create a video from a prompt',
    model: 'fal-ai/kling-video/v2.1/standard/text-to-video',
    output: 'video',
  },
  {
    type: 'text_to_image',
    title: 'Text → Image',
    description: 'Create a product ad image',
    model: 'fal-ai/flux/dev',
    output: 'image',
  },
  {
    type: 'image_to_image',
    title: 'Image → Image',
    description: 'Transform your source image',
    model: 'fal-ai/flux-kontext/dev',
    output: 'image',
  },
]

const MIN_IMAGE_DIMENSION = 256
const imageGenerationOption = generationOptions.find(
  (option) => option.type === 'image_to_image',
)!
const videoGenerationOption = generationOptions.find(
  (option) => option.type === 'image_to_video',
)!

const styles = [
  {
    id: 'minimal',
    name: 'Clean Minimal',
    description: 'Soft lighting with a focus on the product',
    prompt: 'Clean minimal commercial lighting, simple background.',
  },
  {
    id: 'editorial',
    name: 'Fashion Editorial',
    description: 'Expressive, magazine-inspired styling',
    prompt: 'Fashion editorial campaign, expressive light and composition.',
  },
  {
    id: 'cozy',
    name: 'Warm Lifestyle',
    description: 'A natural, cozy atmosphere',
    prompt: 'Warm lifestyle commercial, soft natural light, cozy atmosphere.',
  },
]

function getMediaUrl(outputs: unknown): string | null {
  if (!outputs || typeof outputs !== 'object') return null

  const record = outputs as Record<string, unknown>
  const directUrl = record.video_url ?? record.image_url ?? record.url
  if (typeof directUrl === 'string') return directUrl

  for (const key of ['video', 'image']) {
    const media = record[key]
    if (
      media &&
      typeof media === 'object' &&
      'url' in media &&
      typeof media.url === 'string'
    ) {
      return media.url
    }
  }

  const images = record.images
  if (Array.isArray(images)) {
    const firstImage = images[0]
    if (typeof firstImage === 'string') return firstImage
    if (
      firstImage &&
      typeof firstImage === 'object' &&
      'url' in firstImage &&
      typeof firstImage.url === 'string'
    ) {
      return firstImage.url
    }
  }

  return null
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z" />
      <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  )
}

type AIStudioPageProps = {
  initialProductId?: number
}

function AIStudioPage({ initialProductId }: AIStudioPageProps) {
  const [productId, setProductId] = useState(
    initialProductId ?? products[0].id,
  )
  const selectedProduct =
    products.find((product) => product.id === productId) ?? products[0]
  const [campaignGoal, setCampaignGoal] = useState('')
  const [campaign, setCampaign] = useState<AdCampaign | null>(null)
  const [isAgentGenerating, setIsAgentGenerating] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [generationType, setGenerationType] =
    useState<GenerationType>('image_to_video')
  const [model, setModel] = useState(generationOptions[0].model)
  const [prompt, setPrompt] = useState('')
  const [styleId, setStyleId] = useState(styles[0].id)
  const [status, setStatus] = useState<GenerationStatus>('idle')
  const [generation, setGeneration] = useState<GenerationRecord | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultType, setResultType] = useState<OutputType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedOption =
    generationOptions.find((option) => option.type === generationType) ??
    generationOptions[0]
  const selectedStyle =
    styles.find((style) => style.id === styleId) ?? styles[0]
  const requiresImage =
    generationType === 'image_to_image' ||
    generationType === 'image_to_video'
  const uploadPreview = preview ?? selectedProduct.image

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const nextFile = event.target.files?.[0]
    input.value = ''
    setError(null)
    setGeneration(null)
    setResultUrl(null)
    setResultType(null)

    if (!nextFile) {
      setPreview(null)
      setFile(null)
      setStatus('idle')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      setPreview(null)
      setFile(null)
      setStatus('failed')
      setError('Choose an image file in JPG, PNG, or WebP format.')
      return
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setPreview(null)
      setFile(null)
      setStatus('failed')
      setError('Image size must not exceed 10 MB.')
      return
    }

    let image: ImageBitmap
    try {
      image = await createImageBitmap(nextFile)
    } catch {
      setPreview(null)
      setFile(null)
      setStatus('failed')
      setError('Could not read the image. Choose a different file.')
      return
    }

    const { width, height } = image
    image.close()
    if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
      setPreview(null)
      setFile(null)
      setStatus('failed')
      setError(
        `Image is too small: ${width}×${height} px. Minimum size is ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} px. Choose a larger image.`,
      )
      return
    }

    setPreview(URL.createObjectURL(nextFile))
    setFile(nextFile)
    setStatus('idle')
  }

  function handleTypeChange(type: GenerationType) {
    const option = generationOptions.find((item) => item.type === type)
    if (!option) return

    setGenerationType(type)
    setModel(option.model)
    setError(null)
    setGeneration(null)
    setResultUrl(null)
    setResultType(null)
    setStatus('idle')

    if (!['image_to_image', 'image_to_video'].includes(type)) {
      setFile(null)
      setPreview(null)
    }
  }

  async function handleCreateCampaign() {
    if (!campaignGoal.trim()) {
      setAgentError('Describe the goal for this advertising campaign.')
      return
    }

    setIsAgentGenerating(true)
    setAgentError(null)
    try {
      const result = await createAdCampaign(
        {
          name: selectedProduct.name,
          description: selectedProduct.description,
          category: selectedProduct.category,
          image: selectedProduct.image,
        },
        campaignGoal.trim(),
      )
      setCampaign(result)
    } catch (generationError) {
      setAgentError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not create an advertising campaign.',
      )
    } finally {
      setIsAgentGenerating(false)
    }
  }

  async function handleGenerate(overrides?: {
    type: GenerationType
    model: string
    prompt: string
    image?: File | string
  }) {
    const activeType = overrides?.type ?? generationType
    const activeModel = overrides?.model ?? model
    const activePrompt = overrides?.prompt ?? prompt
    const activeOption =
      generationOptions.find((option) => option.type === activeType) ??
      generationOptions[0]
    const needsImage =
      activeType === 'image_to_image' || activeType === 'image_to_video'
    const activeImage =
      overrides?.image ?? file ?? (needsImage ? selectedProduct.image : undefined)

    if (needsImage && !activeImage) {
      setError('Upload a product image first to use this mode.')
      return
    }

    if (!activePrompt.trim()) {
      setError('Describe the result you want to create.')
      return
    }

    if (!activeModel.trim()) {
      setError('Enter a fal.ai model endpoint ID.')
      return
    }

    setGenerationType(activeType)
    setModel(activeModel)
    setPrompt(activePrompt)
    setError(null)
    setStatus('generating')
    setGeneration(null)
    setResultUrl(null)
    setResultType(null)

    try {
      const submitted = await createGeneration({
        model: activeModel.trim(),
        type: activeType,
        prompt: overrides
          ? activePrompt.trim()
          : `${selectedStyle.prompt} ${activePrompt.trim()}`,
        ...(activeImage ? { image: activeImage } : {}),
      })
      setGeneration(submitted)

      let current = submitted
      for (let attempt = 0; attempt < 180; attempt += 1) {
        if (current.status === 'completed') break
        if (current.status === 'failed') {
          throw new Error(current.errorMessage || 'Generation failed.')
        }

        await wait(3000)
        current = await getGeneration(current)
        setGeneration(current)
      }

      if (current.status !== 'completed') {
        throw new Error(
          `Generation is still in progress. Task ID: ${current.requestId}`,
        )
      }

      const mediaUrl = getMediaUrl(current.outputs)
      if (!mediaUrl) {
        throw new Error(
          'Generation completed, but the model response did not include a result URL.',
        )
      }

      const safeMediaUrl = new URL(mediaUrl)
      if (safeMediaUrl.protocol !== 'https:') {
        throw new Error('The model returned an insecure result URL.')
      }

      setResultUrl(safeMediaUrl.toString())
      setResultType(activeOption.output)
      setStatus('completed')
    } catch (generationError) {
      setStatus('failed')
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not start generation. Please try again.',
      )
    }

  }

  function generateCampaignImage(imagePrompt: string) {
    void handleGenerate({
      type: imageGenerationOption.type,
      model: imageGenerationOption.model,
      prompt: imagePrompt,
      image: selectedProduct.image,
    })
  }

  function generateCampaignVideo() {
    if (!campaign) return
    void handleGenerate({
      type: videoGenerationOption.type,
      model: videoGenerationOption.model,
      prompt: campaign.videoPrompt,
      image: selectedProduct.image,
    })
  }

  return (
    <main className="studio-page">
      <section className="studio-page-heading">
        <span className="section-kicker">YOUR IDEA. OUR NEXT FRAME.</span>
        <h1>
          AI <span>Studio</span>
        </h1>
        <p>
          Choose a generation type, add a prompt, and create a product image or
          video ad.
        </p>
      </section>

      <div className="studio-workspace">
        <section className="studio-form">
          <section className="ad-agent-panel" aria-labelledby="ad-agent-title">
            <div className="ad-agent-heading">
              <span className="section-kicker">MANUS AI CREATIVE AGENT</span>
              <h2 id="ad-agent-title">Build a product campaign</h2>
              <p>
                Get a campaign concept and ready-to-use image and video prompts
                for a product.
              </p>
            </div>

            <label className="ad-agent-field">
              <span>Choose a product</span>
              <select
                value={productId}
                onChange={(event) => {
                  setProductId(Number(event.target.value))
                  setCampaign(null)
                  setFile(null)
                  setPreview(null)
                  setAgentError(null)
                }}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.category}
                  </option>
                ))}
              </select>
            </label>
            <div className="ad-agent-product">
              <img src={selectedProduct.image} alt="" />
              <div>
                <strong>{selectedProduct.name}</strong>
                <span>{selectedProduct.description}</span>
              </div>
            </div>
            <label className="ad-agent-field">
              <span>Campaign goal</span>
              <textarea
                value={campaignGoal}
                maxLength={1000}
                onChange={(event) => setCampaignGoal(event.target.value)}
                placeholder="For example: increase online sales among young professionals"
                rows={2}
              />
            </label>
            {agentError && (
              <p className="studio-error agent-error" role="alert">
                {agentError}
              </p>
            )}
            <button
              className="button button-dark ad-agent-submit"
              type="button"
              disabled={isAgentGenerating || status === 'generating'}
              onClick={() => void handleCreateCampaign()}
            >
              {isAgentGenerating ? (
                <>
                  <span className="loading-spinner" aria-hidden="true" />
                  Creating campaign…
                </>
              ) : campaign ? (
                'Regenerate campaign'
              ) : (
                'Create campaign'
              )}
            </button>

            {campaign && (
              <div className="ad-campaign-result">
                <div className="ad-campaign-copy">
                  <span className="section-kicker">CAMPAIGN CONCEPT</span>
                  <p>{campaign.concept}</p>
                  <h3>Target audience</h3>
                  <p>{campaign.targetAudience}</p>
                </div>
                <div className="ad-campaign-copy">
                  <span className="section-kicker">PRODUCT AD COPY</span>
                  <h3>{campaign.headline}</h3>
                  <p>{campaign.productDescription}</p>
                </div>
                <div className="ad-prompt-list">
                  <span className="section-kicker">IMAGE PROMPTS</span>
                  {campaign.imagePrompts.map((imagePrompt, index) => (
                    <article className="ad-prompt-card" key={`${index}-${imagePrompt.slice(0, 24)}`}>
                      <span>Image concept {index + 1}</span>
                      <p>{imagePrompt}</p>
                      <button
                        className="button button-dark"
                        type="button"
                        disabled={status === 'generating'}
                        onClick={() => generateCampaignImage(imagePrompt)}
                      >
                        Generate Image
                      </button>
                    </article>
                  ))}
                </div>
                <div className="ad-prompt-card ad-video-prompt">
                  <span>VIDEO PROMPT</span>
                  <p>{campaign.videoPrompt}</p>
                  <button
                    className="button button-dark"
                    type="button"
                    disabled={status === 'generating'}
                    onClick={generateCampaignVideo}
                  >
                    Generate Video
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="studio-step">
            <span className="step-number">01</span>
            <div>
              <h2>Choose a generation format</h2>
              <p>Create product images and videos for your ads.</p>
            </div>
          </div>

          <div className="generation-type-options">
            {generationOptions.map((option) => (
              <button
                className={`generation-type-option${generationType === option.type ? ' selected' : ''}`}
                key={option.type}
                type="button"
                aria-pressed={generationType === option.type}
                onClick={() => handleTypeChange(option.type)}
              >
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>

          <p className="studio-disclaimer">
            For this local demo, the selected product photo is used automatically
            in image-based generation. You can upload another photo below.
          </p>

          <label className="model-field">
            <span>fal.ai model · endpoint ID</span>
            <input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="fal-ai/..."
              autoComplete="off"
            />
          </label>

          <label className="prompt-field">
            <span>Describe what you want to create</span>
            <textarea
              value={prompt}
              maxLength={2000}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="For example: a stylish product ad with close-up shots and soft lighting..."
              rows={4}
            />
          </label>

          {requiresImage && (
            <>
              <div className="studio-step">
                <span className="step-number">02</span>
                <div>
                  <h2>Upload a product photo</h2>
                  <p>JPG, PNG, or WebP, at least 256×256 px and up to 10 MB.</p>
                </div>
              </div>

              <label className={`upload-zone${uploadPreview ? ' has-image' : ''}`}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                />
                {uploadPreview ? (
                  <>
                    <img
                      src={uploadPreview}
                      alt={`Preview of ${selectedProduct.name}`}
                    />
                    <span className="upload-change">
                      {preview
                        ? 'Click to replace the photo'
                        : 'Using selected product photo · click to upload another'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="upload-icon" aria-hidden="true">↑</span>
                    <strong>Drop a photo here</strong>
                    <span>or click to choose a file</span>
                    <small>JPG, PNG, or WebP · at least 256×256 px</small>
                  </>
                )}
              </label>
            </>
          )}

          <div className="studio-step style-step">
            <span className="step-number">{requiresImage ? '03' : '02'}</span>
            <div>
              <h2>Choose a style</h2>
              <p>The style will be added to your prompt.</p>
            </div>
          </div>

          <div className="style-options">
            {styles.map((style) => (
              <button
                className={`style-option${styleId === style.id ? ' selected' : ''}`}
                key={style.id}
                type="button"
                aria-pressed={styleId === style.id}
                onClick={() => setStyleId(style.id)}
              >
                <span className={`style-swatch ${style.id}`} aria-hidden="true" />
                <span>
                  <strong>{style.name}</strong>
                  <small>{style.description}</small>
                </span>
                <span className="style-check" aria-hidden="true">
                  ✓
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="studio-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button-dark generate-button"
            type="button"
            disabled={status === 'generating'}
            onClick={() => void handleGenerate()}
          >
            {status === 'generating' ? (
              <>
                <span className="loading-spinner" aria-hidden="true" />
                Generating · {generation?.progress ?? 0}%
              </>
            ) : (
              <>
                ✳ Create {selectedOption.output === 'video' ? 'video' : 'image'}{' '}
                <span aria-hidden="true">↗</span>
              </>
            )}
          </button>
          <p className="studio-disclaimer">
            Generation uses your local Vite server and the fal.ai API key from
            .env. Requests are not available on the static Firebase Hosting build.
            Pricing depends on the fal.ai model.
          </p>
        </section>

        <section className="studio-result" aria-live="polite">
          <div className="result-heading">
            <div>
              <span className="section-kicker">YOUR WORKSPACE</span>
              <h2>Preview</h2>
            </div>
            <span className={`status-pill ${status}`}>
              <span />
              {status === 'generating'
                ? 'Queued'
                : status === 'completed'
                  ? 'Complete'
                  : status === 'failed'
                    ? 'Error'
                    : 'Ready to start'}
            </span>
          </div>

          {resultUrl && resultType === 'video' ? (
            <div className="video-player">
              <video controls playsInline aria-label="Generated video">
                <source src={resultUrl} />
                Your browser does not support video playback.
              </video>
            </div>
          ) : resultUrl ? (
            <div className="generated-image-result">
              <img src={resultUrl} alt="Generated image" />
              <a
                className="button button-dark"
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open image ↗
              </a>
            </div>
          ) : preview ? (
            <div className="video-player">
              <div
                className="video-placeholder"
                role="img"
                aria-label="Preview of the uploaded product"
                style={{ backgroundImage: `url("${preview}")` }}
              >
                <span className="video-placeholder-message">
                  Photo uploaded. Start generation to create a result.
                </span>
              </div>
            </div>
          ) : (
            <div className="studio-result-empty">
              <span className="empty-sparkle">
                <SparkleIcon />
              </span>
              <h3>Let the magic begin</h3>
              <p>Choose a format and describe the result you want.</p>
            </div>
          )}

          {generation && (
            <div className="generation-summary">
              <span>Task: {generation.requestId}</span>
              <span>Model: {generation.model}</span>
              <span>Status: {generation.status}</span>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default AIStudioPage
