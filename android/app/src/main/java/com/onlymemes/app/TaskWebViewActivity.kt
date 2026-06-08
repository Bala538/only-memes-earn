package com.onlymemes.app

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class TaskWebViewActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var tvTimer: TextView
    private lateinit var btnClaim: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var overlayWarning: FrameLayout
    private lateinit var btnStay: Button
    private lateinit var btnLeave: Button

    private var timer: CountDownTimer? = null
    private var isTaskCompleted = false
    private var timeRemaining = 60000L // Default 60 seconds

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_task_webview)

        // Bind Views
        webView = findViewById(R.id.webView)
        tvTimer = findViewById(R.id.tvTimer)
        btnClaim = findViewById(R.id.btnClaim)
        progressBar = findViewById(R.id.progressBar)
        overlayWarning = findViewById(R.id.overlayWarning)
        btnStay = findViewById(R.id.btnStay)
        btnLeave = findViewById(R.id.btnLeave)

        // Get Intent Data
        val url = intent.getStringExtra("EXTRA_URL") ?: "https://google.com"
        val seconds = intent.getIntExtra("EXTRA_SECONDS", 60)
        timeRemaining = seconds * 1000L

        setupWebView()
        setupButtons()
        
        // Load URL
        webView.loadUrl(url)
    }

    private fun setupWebView() {
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                }
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Start timer only when page fully loads for the first time
                if (timer == null) {
                    startTimer()
                }
            }
        }
    }

    private fun startTimer() {
        timer = object : CountDownTimer(timeRemaining, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                timeRemaining = millisUntilFinished
                val seconds = millisUntilFinished / 1000
                tvTimer.text = "Wait: ${seconds}s"
            }

            override fun onFinish() {
                isTaskCompleted = true
                tvTimer.text = "Completed!"
                tvTimer.setTextColor(resources.getColor(android.R.color.holo_green_light))
                
                btnClaim.isEnabled = true
                btnClaim.alpha = 1.0f
                btnClaim.text = "CLAIM NOW"
            }
        }.start()
    }

    private fun setupButtons() {
        btnClaim.setOnClickListener {
            if (isTaskCompleted) {
                // Return success to main app
                val resultIntent = Intent()
                resultIntent.putExtra("STATUS", "COMPLETED")
                setResult(Activity.RESULT_OK, resultIntent)
                finish()
            }
        }

        btnStay.setOnClickListener {
            overlayWarning.visibility = View.GONE
        }

        btnLeave.setOnClickListener {
            timer?.cancel()
            setResult(Activity.RESULT_CANCELED)
            finish()
        }
    }

    // Prevent Back Button Abuse
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            if (!isTaskCompleted) {
                overlayWarning.visibility = View.VISIBLE
            } else {
                super.onBackPressed()
            }
        }
    }

    override fun onDestroy() {
        timer?.cancel()
        super.onDestroy()
    }
}
