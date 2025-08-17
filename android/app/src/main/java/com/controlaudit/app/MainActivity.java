package com.controlaudit.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Habilitar zoom en el WebView
        bridge.getWebView().getSettings().setBuiltInZoomControls(true);
        bridge.getWebView().getSettings().setDisplayZoomControls(false);
        bridge.getWebView().getSettings().setSupportZoom(true);
        bridge.getWebView().getSettings().setLoadWithOverviewMode(true);
        bridge.getWebView().getSettings().setUseWideViewPort(true);
    }
}
