import { useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader } from "@zxing/browser"

interface ScanResult {
  status: string
  date: string
  time: string
  originalCode: string
}

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [showResult, setShowResult] = useState(false)

  // Use a ref to keep the reader instance stable
  const codeReader = useRef(new BrowserQRCodeReader())

  useEffect(() => {
    if (!isScanning) return

    let mounted = true

    const startScanning = async () => {
      try {
        if (!videoRef.current) return

        // Get available video devices
        const videoInputDevices =
          await BrowserQRCodeReader.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          console.error("No video input devices found")
          return
        }

        // Try to find back camera (environment), otherwise use the first available
        let selectedDeviceId = videoInputDevices[0].deviceId
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("environment")
        )

        if (backCamera) {
          selectedDeviceId = backCamera.deviceId
        }

        // decodeOnceFromVideoDevice returns a Promise that resolves when a code is detected
        const scanResult = await codeReader.current.decodeOnceFromVideoDevice(
          selectedDeviceId,
          videoRef.current
        )

        if (mounted && scanResult) {
          handleScan(scanResult.getText())
        }
      } catch (err) {
        console.error("Scanning error:", err)
        // Retry logic could go here, but for now we just log
        if (mounted) {
          // Optional: wait and retry?
        }
      }
    }

    startScanning()

    return () => {
      mounted = false
      // We can't easily cancel the promise, but we can stop the video tracks if we wanted to.
      // BrowserQRCodeReader manages the video element srcObject.
      // To be safe, we could try to stop the stream if we are unmounting.
      // But decodeOnce... usually handles it.
    }
  }, [isScanning])

  const handleScan = async (code: string) => {
    setIsScanning(false)
    try {
      const response = await fetch("/api/validate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) throw new Error("Network response was not ok")

      const data = await response.json()
      setResult(data)
      setShowResult(true)
    } catch (error) {
      console.error("Error validating QR:", error)
      setResult({
        status: "error",
        date: "-",
        time: "-",
        originalCode: code,
      })
      setShowResult(true)
    }
  }

  const handleScanAgain = () => {
    setShowResult(false)
    setTimeout(() => {
      setResult(null)
      setIsScanning(true)
    }, 300)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "neiskorišteno":
        return {
          title: "Validan kod",
          iconClass: "bg-green-100 text-green-600",
          badgeClass: "bg-green-100 text-green-800",
        }
      case "iskorišteno":
        return {
          title: "Već iskorišteno",
          iconClass: "bg-yellow-100 text-yellow-600",
          badgeClass: "bg-yellow-100 text-yellow-800",
        }
      case "nepostojeće":
        return {
          title: "Nepoznat kod",
          iconClass: "bg-red-100 text-red-600",
          badgeClass: "bg-red-100 text-red-800",
        }
      case "isteklo":
        return {
          title: "Istekao kod",
          iconClass: "bg-orange-100 text-orange-600",
          badgeClass: "bg-orange-100 text-orange-800",
        }
      default:
        return {
          title: "Greška",
          iconClass: "bg-gray-100 text-gray-600",
          badgeClass: "bg-gray-100 text-gray-800",
        }
    }
  }

  const statusConfig = result
    ? getStatusConfig(result.status)
    : getStatusConfig("")

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        id="qr-video"
        className="absolute inset-0 h-full w-full object-cover"
        muted // Good practice for autoplay
        playsInline // Required for iOS
      />

      {/* Overlay with Scanner Frame */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Dark overlay mask effect using box-shadow */}
        <div className="relative h-72 w-72 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-blue-500"></div>
          <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-blue-500"></div>

          {/* Scanning animation line */}
          <div className="absolute left-0 top-0 h-full w-full overflow-hidden rounded-3xl">
            <div className="h-1 w-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-scan"></div>
          </div>
        </div>

        <p className="mt-12 text-white/90 font-medium tracking-wide drop-shadow-md">
          Skeniraj QR kod
        </p>
      </div>

      {/* Result Overlay (Bottom Sheet) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 ease-out rounded-t-3xl bg-white p-6 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] ${
          showResult ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-300"></div>

        {result && (
          <div className="flex flex-col gap-6">
            {/* Status Header */}
            <div className="flex items-center gap-4">
              <div
                className={`rounded-full p-3 transition-colors duration-300 ${statusConfig.iconClass}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {statusConfig.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {result.date} {result.time}
                </p>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${statusConfig.badgeClass}`}
                >
                  {result.status}
                </span>
              </div>
              <div className="h-px bg-gray-200 w-full"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">QR Kod</span>
                <span className="font-mono text-sm font-medium text-gray-900 truncate max-w-[180px]">
                  {result.originalCode}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleScanAgain}
          className="mt-8 w-full rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
        >
          Skeniraj novi kod
        </button>
      </div>
    </div>
  )
}
