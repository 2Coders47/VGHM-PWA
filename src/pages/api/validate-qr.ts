import type { APIRoute } from "astro"

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const { code } = body

    // Ovdje bi išla stvarna provjera s Medusa backendom
    // Za sada simuliramo odgovor

    const statuses = ["neiskorišteno", "iskorišteno", "nepostojeće", "isteklo"]
    // Simuliramo različite statuse nasumično radi demonstracije
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    const now = new Date()

    return new Response(
      JSON.stringify({
        status: randomStatus,
        date: now.toLocaleDateString("hr-HR"),
        time: now.toLocaleTimeString("hr-HR"),
        originalCode: code,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Invalid request",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}
