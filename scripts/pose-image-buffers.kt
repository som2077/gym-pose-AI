package com.margelo.nitro.nitroposeexercises

import java.nio.ByteBuffer

/** Copy camera-owned YUV_420_888 planes without retaining their buffers. */
object PoseImageBuffers {
  fun packNv21(width: Int, height: Int, buffers: Array<ByteBuffer>, rowStrides: IntArray, pixelStrides: IntArray): ByteArray {
    require(width > 0 && height > 0 && width % 2 == 0 && height % 2 == 0)
    require(buffers.size == 3 && rowStrides.size == 3 && pixelStrides.size == 3)
    val bytes = ByteArray(width * height * 3 / 2)
    for (planeIndex in 0..2) {
      val buffer = buffers[planeIndex].duplicate()
      val base = buffer.position()
      val planeWidth = if (planeIndex == 0) width else width / 2
      val planeHeight = if (planeIndex == 0) height else height / 2
      for (row in 0 until planeHeight) {
        for (column in 0 until planeWidth) {
          val target = if (planeIndex == 0) row * width + column
            else width * height + row * width + column * 2 + (if (planeIndex == 1) 1 else 0)
          bytes[target] = buffer.get(base + row * rowStrides[planeIndex] + column * pixelStrides[planeIndex])
        }
      }
    }
    return bytes
  }
}
