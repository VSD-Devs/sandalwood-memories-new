#!/usr/bin/env node

/**
 * Image optimization script for static assets
 * This script compresses and optimizes images in the public folder
 */

import { promises as fs } from 'fs'
import { join, extname } from 'path'
import { execSync } from 'child_process'

const PUBLIC_DIR = './public'
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

// Check if sharp is available, if not install it
async function ensureSharp() {
  try {
    await import('sharp')
  } catch {
    console.log('Installing sharp for image optimization...')
    execSync('npm install sharp --save-dev', { stdio: 'inherit' })
  }
}

// Optimize a single image
async function optimizeImage(inputPath, outputPath) {
  const sharp = await import('sharp')
  const ext = extname(inputPath).toLowerCase()

  let pipeline = sharp.default(inputPath)

  // Apply different optimizations based on file type
  if (ext === '.png') {
    pipeline = pipeline.png({
      compressionLevel: 9,
      quality: 85,
      effort: 10
    })
  } else if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({
      quality: 85,
      progressive: true,
      mozjpeg: true
    })
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({
      quality: 85,
      effort: 6
    })
  }

  await pipeline.toFile(outputPath)
}

// Convert PNG to WebP for better compression
async function convertToWebP(inputPath, outputPath) {
  const sharp = await import('sharp')
  await sharp.default(inputPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(outputPath)
}

// Get file size in MB
async function getFileSizeMB(filePath) {
  const stats = await fs.stat(filePath)
  return (stats.size / (1024 * 1024)).toFixed(2)
}

// Process all images in the public directory
async function optimizeImages() {
  try {
    await ensureSharp()

    const files = await fs.readdir(PUBLIC_DIR)
    const imageFiles = files.filter(file => {
      const ext = extname(file).toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(ext) && !file.includes('.min.')
    })

    console.log(`Found ${imageFiles.length} images to optimize`)

    for (const file of imageFiles) {
      const inputPath = join(PUBLIC_DIR, file)
      const ext = extname(file)
      const name = file.replace(ext, '')
      const optimizedPath = join(PUBLIC_DIR, `${name}.optimized${ext}`)
      const webpPath = join(PUBLIC_DIR, `${name}.webp`)

      try {
        const originalSize = await getFileSizeMB(inputPath)
        console.log(`Optimizing ${file} (${originalSize}MB)...`)

        // Optimize the original format
        await optimizeImage(inputPath, optimizedPath)
        const optimizedSize = await getFileSizeMB(optimizedPath)

        // Convert to WebP for even better compression
        await convertToWebP(inputPath, webpPath)
        const webpSize = await getFileSizeMB(webpPath)

        console.log(`  Original: ${originalSize}MB`)
        console.log(`  Optimized: ${optimizedSize}MB (${((1 - optimizedSize / originalSize) * 100).toFixed(1)}% reduction)`)
        console.log(`  WebP: ${webpSize}MB (${((1 - webpSize / originalSize) * 100).toFixed(1)}% reduction)`)

        // Replace original with optimized version if it's smaller
        if (parseFloat(optimizedSize) < parseFloat(originalSize)) {
          await fs.rename(optimizedPath, inputPath)
          console.log(`  ✓ Replaced original with optimized version`)
        } else {
          await fs.unlink(optimizedPath)
        }

      } catch (error) {
        console.error(`Failed to optimize ${file}:`, error.message)
      }
    }

    console.log('Image optimization complete!')

  } catch (error) {
    console.error('Error during image optimization:', error)
    process.exit(1)
  }
}

// Run the optimization
optimizeImages()


