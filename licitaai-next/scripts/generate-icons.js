const { createCanvas } = require('canvas')
const fs = require('fs')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background gradient azul
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#1d4ed8')
  gradient.addColorStop(1, '#7c3aed')
  ctx.fillStyle = gradient
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Letra L branca
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.5}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('L', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

fs.writeFileSync('public/icon-192.png', generateIcon(192))
fs.writeFileSync('public/icon-512.png', generateIcon(512))
console.log('Icones gerados!')
