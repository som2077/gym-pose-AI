// This method is inserted into NitroPoseExercises by patch-nitro-pose-runtime.cjs.
// ML Kit owns a byte-array copy, never the camera's short-lived ImageProxy.
@Synchronized
override fun processFrameAndroid(frame: HybridFrameSpec) {
  if (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN) return
  val detector = poseDetector ?: return
  if (!isInitialized || pendingPose != null) return
  val now = System.currentTimeMillis()
  if (now - lastProcessTime < minIntervalMs) return
  lastProcessTime = now
  val image = (frame as? NativeFrame)?.image ?: return
  try {
    val width = image.width
    val height = image.height
    val rotation = image.imageInfo.rotationDegrees
    val planes = image.planes
    val bytes = PoseImageBuffers.packNv21(width, height,
      Array(planes.size) { planes[it].buffer },
      IntArray(planes.size) { planes[it].rowStride },
      IntArray(planes.size) { planes[it].pixelStride })
    val input = InputImage.fromByteArray(bytes, width, height, rotation, InputImage.IMAGE_FORMAT_NV21)
    val generation = sessionGeneration
    val task = detector.process(input)
    pendingPose = task
    task.addOnCompleteListener { completed ->
      synchronized(this@NitroPoseExercises) {
        if (pendingPose === task) pendingPose = null
        // Ignore results from a previous exercise, closed screen or paused session.
        if (generation != sessionGeneration || poseDetector !== detector ||
          (_status != SessionStatus.ACTIVE && _status != SessionStatus.COUNTDOWN)) return@addOnCompleteListener
        val points = if (completed.isSuccessful) completed.result.allPoseLandmarks else emptyList()
        if (points.isEmpty()) {
          _landmarks = emptyArray()
          synchronized(landmarkLock) { cachedLandmarks = emptyArray() }
          if (!poseWasLost) {
            poseWasLost = true
            onPoseLost?.invoke()
          }
        } else {
          val rotated = rotation == 90 || rotation == 270
          val imageWidth = (if (rotated) height else width).toDouble()
          val imageHeight = (if (rotated) width else height).toDouble()
          // Slot 34 is app metadata, never a joint: oriented size + capture time.
          val result = Array(35) { Landmark(x = 0.0, y = 0.0, z = 0.0, visibility = 0.0) }
          result[34] = Landmark(x = imageWidth, y = imageHeight, z = now.toDouble(), visibility = 0.0)
          for (point in points) {
            val index = mlKitToMediaPipeMap[point.landmarkType] ?: continue
            result[index] = Landmark(
              // position3D is metric/world space, not image pixels. ML Kit's
              // 2D position is in the oriented InputImage pixel coordinate space.
              x = point.position.x / imageWidth,
              y = point.position.y / imageHeight,
              z = point.position3D.z.toDouble(), visibility = point.inFrameLikelihood.toDouble())
          }
          synchronized(landmarkLock) { cachedLandmarks = result; _landmarks = result }
          if (poseWasLost) { poseWasLost = false; onPoseRegained?.invoke() }
          processExerciseLogic()
        }
      }
    }
  } catch (error: Exception) {
    _landmarks = emptyArray()
    synchronized(landmarkLock) { cachedLandmarks = emptyArray() }
    android.util.Log.e("PoseExercise", "Frame processing failed", error)
  }
}
