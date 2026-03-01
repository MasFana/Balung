"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Diet = { id: number; name: string };
type Ingredient = { id: number; name: string; type: string; basePricePerKg: number };
type Recipe = {
  id: number;
  dietId: number;
  ingredientId: number;
  gramPerPatientPerDay: number;
  ingredientName: string;
  ingredientType: string;
  basePricePerKg: number;
};

export default function MasterDataPage() {
  const [diets, setDiets] = useState<Diet[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  const [selectedDiet, setSelectedDiet] = useState<Diet | null>(null);
  
  const [newDietName, setNewDietName] = useState("");
  const [editingDietId, setEditingDietId] = useState<number | null>(null);
  const [editDietName, setEditDietName] = useState("");

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [newGrammage, setNewGrammage] = useState<string>("");
  
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editGrammage, setEditGrammage] = useState<string>("");

  useEffect(() => {
    fetchDiets();
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (selectedDiet) {
      fetchRecipes(selectedDiet.id);
    } else {
      setRecipes([]);
    }
  }, [selectedDiet]);

  const fetchDiets = async () => {
    const res = await fetch("/api/diets");
    const data = await res.json();
    setDiets(Array.isArray(data) ? data : []);
  };

  const fetchIngredients = async () => {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(Array.isArray(data) ? data : []);
  };

  const fetchRecipes = async (dietId: number) => {
    const res = await fetch(`/api/recipes?dietId=${dietId}`);
    const data = await res.json();
    setRecipes(Array.isArray(data) ? data : []);
  };

  // Diet Handlers
  const handleAddDiet = async () => {
    if (!newDietName.trim()) return;
    await fetch("/api/diets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDietName }),
    });
    setNewDietName("");
    fetchDiets();
  };

  const handleUpdateDiet = async (id: number) => {
    if (!editDietName.trim()) return;
    await fetch(`/api/diets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editDietName }),
    });
    setEditingDietId(null);
    fetchDiets();
    if (selectedDiet?.id === id) {
      setSelectedDiet({ id, name: editDietName });
    }
  };

  const handleDeleteDiet = async (id: number) => {
    if (!confirm("Are you sure? This will delete all recipes for this diet.")) return;
    await fetch(`/api/diets/${id}`, { method: "DELETE" });
    if (selectedDiet?.id === id) setSelectedDiet(null);
    fetchDiets();
  };

  // Recipe Handlers
  const handleAddRecipe = async () => {
    if (!selectedDiet || !selectedIngredientId || !newGrammage) return;
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dietId: selectedDiet.id,
        ingredientId: selectedIngredientId,
        gramPerPatientPerDay: newGrammage,
      }),
    });
    setSelectedIngredientId("");
    setNewGrammage("");
    fetchRecipes(selectedDiet.id);
  };

  const handleUpdateRecipe = async (id: number) => {
    if (!editGrammage) return;
    await fetch(`/api/recipes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gramPerPatientPerDay: editGrammage }),
    });
    setEditingRecipeId(null);
    if (selectedDiet) fetchRecipes(selectedDiet.id);
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm("Remove this ingredient?")) return;
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (selectedDiet) fetchRecipes(selectedDiet.id);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-6rem)] gap-6">
      {/* Left Pane: Diets */}
      <div className={`w-full md:w-1/3 flex flex-col gap-4 border-r dark:border-slate-800 pr-0 md:pr-6 ${selectedDiet ? 'hidden md:flex' : 'flex'}`}>
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Diets (Menu Templates)</h2>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="New diet name..."
              value={newDietName}
              onChange={(e: any) => setNewDietName(e.target.value)}
              className="bg-white dark:bg-slate-900"
            />
            <Button onClick={handleAddDiet} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-8">
          {diets.map((diet) => (
            <div
              key={diet.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedDiet?.id === diet.id
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
              onClick={() => setSelectedDiet(diet)}
            >
              {editingDietId === diet.id ? (
                <div className="flex items-center gap-2 w-full" onClick={(e: any) => e.stopPropagation()}>
                  <Input
                    value={editDietName}
                    onChange={(e: any) => setEditDietName(e.target.value)}
                    className="h-8"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdateDiet(diet.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500" onClick={() => setEditingDietId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{diet.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-500"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setEditDietName(diet.name);
                        setEditingDietId(diet.id);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleDeleteDiet(diet.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-slate-400 md:hidden" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Recipes */}
      <div className={`w-full md:w-2/3 flex flex-col gap-4 h-full ${!selectedDiet ? 'hidden md:flex' : 'flex'}`}>
        {selectedDiet ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedDiet(null)}>
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Recipe Builder: {selectedDiet.name}
              </h2>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">Ingredient</label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  value={selectedIngredientId}
                  onChange={(e: any) => setSelectedIngredientId(e.target.value)}
                >
                  <option value="">Select an ingredient...</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="text-sm font-medium mb-1 block text-slate-700 dark:text-slate-300">Grammage (g)</label>
                <Input
                  type="number"
                  placeholder="g/patient"
                  value={newGrammage}
                  onChange={(e: any) => setNewGrammage(e.target.value)}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <Button onClick={handleAddRecipe} disabled={!selectedIngredientId || !newGrammage}>
                Add
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm relative">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300">Ingredient</th>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300">Type</th>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300">Gram/Patient/Day</th>
                      <th className="p-3 font-medium text-slate-700 dark:text-slate-300 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          No ingredients added yet.
                        </td>
                      </tr>
                    ) : (
                      recipes.map((recipe) => (
                        <tr key={recipe.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="p-3 text-slate-900 dark:text-slate-100 font-medium">{recipe.ingredientName}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${recipe.ingredientType === 'WET' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                              {recipe.ingredientType}
                            </span>
                          </td>
                          <td className="p-3">
                            {editingRecipeId === recipe.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={editGrammage}
                                  onChange={(e: any) => setEditGrammage(e.target.value)}
                                  className="w-20 h-8"
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleUpdateRecipe(recipe.id)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500" onClick={() => setEditingRecipeId(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{recipe.gramPerPatientPerDay} g</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {editingRecipeId !== recipe.id && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-500"
                                  onClick={() => {
                                    setEditGrammage(recipe.gramPerPatientPerDay.toString());
                                    setEditingRecipeId(recipe.id);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-500"
                                  onClick={() => handleDeleteRecipe(recipe.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <p>Select a diet from the list to manage its recipe.</p>
          </div>
        )}
      </div>
    </div>
  );
}