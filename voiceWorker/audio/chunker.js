function extractNextChunk(buffer) {
  const hard = buffer.match(/^.{15,}?[.!?](\s|$)/)
  if (hard)
    return {
      chunk: hard[0].trim(),
      rest: buffer.slice(hard[0].length).trimStart(),
    }

  const soft = buffer.match(/^.{10,}?[,;:](\s|$)/)
  if (soft && soft[0].trim().split(/\s+/).length >= 6)
    return {
      chunk: soft[0].trim(),
      rest: buffer.slice(soft[0].length).trimStart(),
    }

  const words = buffer.split(/\s+/)
  if (words.length >= 12) {
    const chunk = words.slice(0, 12).join(" ")
    return {
      chunk,
      rest: buffer.slice(chunk.length).trimStart(),
    }
  }

  return null
}

module.exports = { extractNextChunk }