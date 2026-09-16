import com.margelo.nitro.nitroposeexercises.PoseImageBuffers;
import java.nio.ByteBuffer;
import java.util.Arrays;

// Run with scripts/test-pose-buffers.cjs after an Android debug build.
class PoseImageBuffersTest {
  public static void main(String[] args) {
    for (int pixelStride : new int[] {1, 2}) {
      for (int padding : new int[] {0, 5}) {
        for (int offset : new int[] {0, 3}) {
          checkLayout(pixelStride, padding, offset);
        }
      }
    }
    System.out.println("PASS: 8 YUV layouts, NV21 chroma order, buffer positions and independent ownership");
  }

  private static void checkLayout(int chromaStride, int padding, int offset) {
    int[] rows = {4 + padding, 2 * chromaStride + padding, 2 * chromaStride + padding};
    int[] pixels = {1, chromaStride, chromaStride};
    ByteBuffer[] planes = new ByteBuffer[3];
    for (int plane = 0; plane < 3; plane++) {
      int width = plane == 0 ? 4 : 2;
      int height = plane == 0 ? 4 : 2;
      // No padding after the final pixel: catches reads past the valid limit.
      planes[plane] = ByteBuffer.allocateDirect(offset + (height - 1) * rows[plane] + (width - 1) * pixels[plane] + 1);
      planes[plane].position(offset);
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          planes[plane].put(offset + y * rows[plane] + x * pixels[plane], (byte) (plane * 40 + y * width + x));
        }
      }
    }
    byte[] actual = PoseImageBuffers.INSTANCE.packNv21(4, 4, planes, rows, pixels);
    byte[] expected = {0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,80,40,81,41,82,42,83,43};
    if (!Arrays.equals(expected, actual)) throw new AssertionError(Arrays.toString(actual));
    for (ByteBuffer plane : planes) {
      if (plane.position() != offset) throw new AssertionError("Source position changed");
      for (int i = 0; i < plane.limit(); i++) plane.put(i, (byte) 0);
    }
    if (!Arrays.equals(expected, actual)) throw new AssertionError("Detector image still shares camera memory");
  }
}
