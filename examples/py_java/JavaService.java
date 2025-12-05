import java.net.URI;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONObject;

public class JavaService extends WebSocketClient {
    private String serviceId = "java-service";

    public JavaService(URI serverUri) {
        super(serverUri);
    }

    @Override
    public void onOpen(ServerHandshake handshakedata) {
        System.out.println("[Java Service] Connected to Unikernal");
        
        // Register
        JSONObject registration = new JSONObject();
        registration.put("intent", "REGISTER");
        JSONObject payload = new JSONObject();
        payload.put("service_id", serviceId);
        JSONObject auth = new JSONObject();
        auth.put("key", "adapter-key");
        payload.put("auth", auth);
        registration.put("payload", payload);
        
        this.send(registration.toString());
    }

    @Override
    public void onMessage(String message) {
        System.out.println("[Java Service] Received: " + message);
        // Process message here
    }

    @Override
    public void onClose(int code, String reason, boolean remote) {
        System.out.println("[Java Service] Disconnected");
    }

    @Override
    public void onError(Exception ex) {
        ex.printStackTrace();
    }

    public static void main(String[] args) throws Exception {
        URI uri = new URI("ws://localhost:8080/ws");
        JavaService service = new JavaService(uri);
        service.connect();
    }
}
