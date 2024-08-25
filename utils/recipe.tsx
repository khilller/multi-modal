'use server'

import { cache } from "react"

export const searchRecipes = cache(async (query: string) => {
    try {
        const response  = await fetch(`https://dummyjson.com/recipes/search?limit=1&q=${encodeURIComponent(query)}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        //console.log('data:', data)
        return data

    } catch (error) {
        console.error('Error fetching recipes:', error)
        throw error
    }
})
