"use client"

import { useState } from "react"
import { signIn, signInWithBadge } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge, Wifi } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isNfcLoading, setIsNfcLoading] = useState(false)
  const [nfcSupported, setNfcSupported] = useState(false)

  // Check NFC support on component mount
  window.addEventListener("load", () => {
    if ("NDEFReader" in window) {
      setNfcSupported(true)
    }
  })

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const { data, error: authError } = await signIn(email, password)

    if (authError) {
      setError("Ongeldige inloggegevens")
    } else if (data.user) {
      // Gebruik window.location.href voor een harde redirect
      window.location.href = "/"
    }

    setIsLoading(false)
  }

  const handleNfcScan = async () => {
    setIsNfcLoading(true)
    setError("")

    try {
      if (!("NDEFReader" in window)) {
        setError("NFC wordt niet ondersteund door deze browser")
        setIsNfcLoading(false)
        return
      }

      console.log("🏷️ Starting NFC scan...")

      const ndef = new (window as any).NDEFReader()

      // Request permission and start scanning
      await ndef.scan()

      console.log("🏷️ NFC scan started, waiting for badge...")
      setError("Houd je badge tegen de NFC lezer...")

      // Set up the reading event
      ndef.addEventListener("reading", async ({ message, serialNumber }: any) => {
        console.log("🏷️ NFC badge detected:", serialNumber)

        try {
          // Use the serial number as badge ID
          const badgeId = serialNumber

          console.log("🏷️ Attempting login with badge ID:", badgeId)

          const { data, error: authError } = await signInWithBadge(badgeId)

          if (authError) {
            console.error("🏷️ Badge login error:", authError)
            setError("Badge niet gevonden of niet geregistreerd")
          } else if (data.user) {
            console.log("🏷️ Badge login successful:", data.user.email)
            // Gebruik window.location.href voor een harde redirect (identiek aan email/password login)
            window.location.href = "/"
          } else {
            setError("Badge login mislukt")
          }
        } catch (error) {
          console.error("🏷️ Badge login exception:", error)
          setError("Er ging iets mis bij het inloggen met de badge")
        }

        setIsNfcLoading(false)
      })

      ndef.addEventListener("readingerror", () => {
        console.error("🏷️ NFC reading error")
        setError("Fout bij het lezen van de badge")
        setIsNfcLoading(false)
      })
    } catch (error: any) {
      console.error("🏷️ NFC scan error:", error)

      if (error.name === "NotAllowedError") {
        setError("NFC toegang geweigerd. Geef toestemming voor NFC gebruik.")
      } else if (error.name === "NotSupportedError") {
        setError("NFC wordt niet ondersteund op dit apparaat")
      } else {
        setError("Fout bij het starten van NFC scan")
      }

      setIsNfcLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center">
              <div className="relative w-10 h-10 mr-2">
                <div className="w-10 h-10 border-4 border-red-500 rounded-full relative">
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-lg font-bold text-red-500 tracking-wide">INTERFLON</div>
            </div>
          </div>
          <CardTitle>Inloggen</CardTitle>
          <CardDescription>
            Voer je inloggegevens in of scan je badge om toegang te krijgen tot de Product Registratie app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="naam@interflon.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? "Bezig met inloggen..." : "Inloggen"}
            </Button>
          </form>

          {/* NFC Badge Login Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600 mb-3">Of log in met je badge</div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              onClick={handleNfcScan}
              disabled={isNfcLoading || !nfcSupported}
            >
              {isNfcLoading ? (
                <>
                  <Wifi className="mr-2 h-4 w-4 animate-pulse" />
                  Wachten op badge...
                </>
              ) : (
                <>
                  <Badge className="mr-2 h-4 w-4" />
                  Scan badge
                </>
              )}
            </Button>
            {!nfcSupported && (
              <p className="text-xs text-gray-500 mt-2 text-center">NFC wordt niet ondersteund door deze browser</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
