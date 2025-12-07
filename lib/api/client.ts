const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://prism:4010'

export async function fetchFromAPI(
  endpoint: string,
  options?: RequestInit
): Promise<unknown> {
  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  return response.json()
}

