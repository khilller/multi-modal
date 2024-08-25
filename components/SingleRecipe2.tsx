import React from 'react';
import { Clock, Users, ChefHat, Flame, Star } from 'lucide-react';

export interface Recipe {
    id: number;
    name: string;
    ingredients: string[];
    instructions: string[];
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    difficulty: string;
    cuisine: string;
    caloriesPerServing: number;
    tags: string[];
    userId: number;
    image: string;
    rating: number;
    reviewCount: number;
    mealType: string[];
  }
  
  export interface RecipeCardProps {
    recipe: Recipe;
  }

export const RecipeCard2 = ({ recipe }: RecipeCardProps) => {
  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <img 
        src={recipe.image} 
        alt={recipe.name} 
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{recipe.name}</h2>
        <div className="flex items-center mb-4">
          <Star className="w-5 h-5 text-yellow-400 mr-1" />
          <span>{recipe.rating} ({recipe.reviewCount} reviews)</span>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center">
            <ChefHat className="w-5 h-5 mr-2" />
            <span>{recipe.difficulty}</span>
          </div>
          <div className="flex items-center">
            <Flame className="w-5 h-5 mr-2" />
            <span>{recipe.caloriesPerServing} cal/serving</span>
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">Ingredients:</h3>
        <ul className="list-disc list-inside mb-4">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
        <h3 className="font-semibold text-lg mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside">
          {recipe.instructions.map((step, index) => (
            <li key={index} className="mb-2">{step}</li>
          ))}
        </ol>
        <div className="mt-4">
          <span className="font-semibold">Tags: </span>
          {recipe.tags.join(', ')}
        </div>
      </div>
    </div>
  );
};
