import { useState } from 'react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { useCreateRecipe, useDeleteRecipe, useRecipes } from './useRecipes'
import { RecipeForm } from './RecipeForm'
import { macrosPerServing } from '../../lib/nutrition'

export function RecipesPage() {
  const { data: recipes, isLoading } = useRecipes()
  const createRecipe = useCreateRecipe()
  const deleteRecipe = useDeleteRecipe()
  const [showRecipeModal, setShowRecipeModal] = useState(false)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <span>🍲</span> Rezepte
        </h1>
        <Button onClick={() => setShowRecipeModal(true)}>+ Rezept</Button>
      </div>

      {isLoading && <p className="text-gray-500">Lädt...</p>}
      {!isLoading && recipes?.length === 0 && <p className="text-gray-500">Noch keine Rezepte angelegt.</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recipes?.map((recipe) => {
          const macros = macrosPerServing(recipe)
          return (
            <Card key={recipe.id}>
              <div className="mb-1 flex items-start justify-between">
                <p className="font-medium text-gray-900">{recipe.name}</p>
                <button onClick={() => deleteRecipe.mutate(recipe.id)} className="text-xs text-red-500 hover:underline">
                  Löschen
                </button>
              </div>
              <p className="text-xs text-gray-500">{recipe.servings} Portionen</p>
              <p className="mt-2 text-sm text-gray-600">{Math.round(macros.calories)} kcal / Portion</p>
              <ul className="mt-2 text-xs text-gray-500">
                {recipe.recipe_ingredients.map((ing) => (
                  <li key={ing.id}>
                    {ing.food.name} – {ing.quantity_g}g
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      <Modal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} title="Rezept anlegen">
        <RecipeForm
          onSubmit={async (recipe) => {
            await createRecipe.mutateAsync(recipe)
            setShowRecipeModal(false)
          }}
        />
      </Modal>
    </div>
  )
}
