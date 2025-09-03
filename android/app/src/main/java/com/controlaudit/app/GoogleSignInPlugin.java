package com.controlaudit.app;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.GoogleAuthProvider;

@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {
    private static final String TAG = "GoogleSignInPlugin";
    private static final int RC_SIGN_IN = 9001;
    
    private GoogleSignInClient mGoogleSignInClient;
    private FirebaseAuth mAuth;
    private PluginCall currentCall;

    @Override
    public void load() {
        super.load();
        
        // Inicializar Firebase Auth
        mAuth = FirebaseAuth.getInstance();
        
        // Configurar Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken("909876364192-fqea0cj8m5sccqhghl5vbkhgbtkjc3je.apps.googleusercontent.com")
                .requestEmail()
                .build();
        
        mGoogleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        
        Log.d(TAG, "GoogleSignInPlugin inicializado");
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        Log.d(TAG, "Iniciando Google Sign-In nativo");
        
        // Guardar la llamada actual
        currentCall = call;
        
        // Iniciar el intent de Google Sign-In
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, "signInResultCallback");
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        Log.d(TAG, "Cerrando sesión de Google");
        
        // Cerrar sesión de Firebase
        mAuth.signOut();
        
        // Cerrar sesión de Google
        mGoogleSignInClient.signOut().addOnCompleteListener(task -> {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Sesión cerrada exitosamente");
            call.resolve(result);
        });
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            Log.d(TAG, "Google Sign-In exitoso: " + account.getEmail());
            
            // Autenticar con Firebase
            firebaseAuthWithGoogle(account);
            
        } catch (ApiException e) {
            Log.w(TAG, "Google Sign-In falló: " + e.getStatusCode());
            
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Google Sign-In falló: " + e.getStatusCode());
            
            if (currentCall != null) {
                currentCall.reject("Google Sign-In falló", e);
            }
        }
    }

    private void firebaseAuthWithGoogle(GoogleSignInAccount acct) {
        Log.d(TAG, "Autenticando con Firebase: " + acct.getId());
        
        // Obtener credencial de Google
        String idToken = acct.getIdToken();
        if (idToken == null) {
            Log.e(TAG, "ID Token es null");
            if (currentCall != null) {
                currentCall.reject("ID Token no disponible");
            }
            return;
        }
        
        // Crear credencial de Firebase
        com.google.firebase.auth.AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        
        // Autenticar con Firebase
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(getActivity(), task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "Autenticación con Firebase exitosa");
                        
                        // Obtener usuario de Firebase
                        com.google.firebase.auth.FirebaseUser user = mAuth.getCurrentUser();
                        
                        if (user != null) {
                            // Crear resultado para JavaScript
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("uid", user.getUid());
                            result.put("email", user.getEmail());
                            result.put("displayName", user.getDisplayName());
                            result.put("photoURL", user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : null);
                            
                            // Resolver la llamada
                            if (currentCall != null) {
                                currentCall.resolve(result);
                                currentCall = null;
                            }
                        }
                    } else {
                        Log.w(TAG, "Autenticación con Firebase falló", task.getException());
                        
                        JSObject result = new JSObject();
                        result.put("success", false);
                        result.put("error", "Autenticación con Firebase falló");
                        
                        if (currentCall != null) {
                            currentCall.reject("Autenticación con Firebase falló", task.getException());
                            currentCall = null;
                        }
                    }
                });
    }
}
