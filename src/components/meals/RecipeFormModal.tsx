"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateRecipe, useUpdateRecipe, useDeleteRecipe, type RecipeWithCreator } from "@/hooks/useRecipes";
import { RECIPE_DIFFICULTIES } from "@/constants";

interface Ingredient {
  name: string;
  amount: string | number;
  unit: string;
  notes?: string;
}

interface Instruction {
  step: number;
  text: string;
  timerMinutes?: number;
}

interface RecipeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  mealId: string;
  recipe?: RecipeWithCreator | null;
}

const emptyIngredient = (): Ingredient => ({ name: "", amount: "", unit: "" });
const emptyInstruction = (step: number): Instruction => ({ step, text: "" });

export function RecipeFormModal({
  open,
  onOpenChange,
  tripId,
  mealId,
  recipe,
}: RecipeFormModalProps) {
  const isEdit = !!recipe;
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("4");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [sourceUrl, setSourceUrl] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [instructions, setInstructions] = useState<Instruction[]>([emptyInstruction(1)]);

  useEffect(() => {
    if (open && recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description || "");
      setServings(String(recipe.servings));
      setPrepTime(recipe.prepTimeMinutes ? String(recipe.prepTimeMinutes) : "");
      setCookTime(recipe.cookTimeMinutes ? String(recipe.cookTimeMinutes) : "");
      setDifficulty(recipe.difficulty);
      setSourceUrl(recipe.sourceUrl || "");
      const ing = recipe.ingredients as unknown as Ingredient[];
      setIngredients(ing.length > 0 ? ing : [emptyIngredient()]);
      const ins = recipe.instructions as unknown as Instruction[];
      setInstructions(ins.length > 0 ? ins : [emptyInstruction(1)]);
    } else if (open) {
      setTitle("");
      setDescription("");
      setServings("4");
      setPrepTime("");
      setCookTime("");
      setDifficulty("MEDIUM");
      setSourceUrl("");
      setIngredients([emptyIngredient()]);
      setInstructions([emptyInstruction(1)]);
    }
  }, [open, recipe]);

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const addIngredient = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const updateInstruction = (index: number, text: string) => {
    setInstructions((prev) => prev.map((ins, i) => i === index ? { ...ins, text } : ins));
  };

  const addInstruction = () => {
    setInstructions((prev) => [...prev, emptyInstruction(prev.length + 1)]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length <= 1) return;
    setInstructions((prev) =>
      prev.filter((_, i) => i !== index).map((ins, i) => ({ ...ins, step: i + 1 }))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const filteredIngredients = ingredients.filter((i) => i.name.trim());
    const filteredInstructions = instructions
      .filter((i) => i.text.trim())
      .map((i, idx) => ({ ...i, step: idx + 1 }));

    const payload = {
      title: title.trim(),
      description: description || undefined,
      servings: servings ? parseInt(servings) : 4,
      prepTimeMinutes: prepTime ? parseInt(prepTime) : undefined,
      cookTimeMinutes: cookTime ? parseInt(cookTime) : undefined,
      difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      sourceUrl: sourceUrl || undefined,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
    };

    try {
      if (isEdit && recipe) {
        await updateRecipe.mutateAsync({
          tripId,
          mealId,
          recipeId: recipe.id,
          data: payload,
        });
      } else {
        await createRecipe.mutateAsync({ tripId, mealId, ...payload });
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    try {
      await deleteRecipe.mutateAsync({ tripId, mealId, recipeId: recipe.id });
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createRecipe.isPending || updateRecipe.isPending;

  const difficultyOptions = RECIPE_DIFFICULTIES.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5 text-amber-400" /> : <Plus className="h-5 w-5 text-amber-400" />}
            {isEdit ? "Edit Recipe" : "Add Recipe"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-title" required>Title</Label>
            <Input
              id="recipe-title"
              placeholder="e.g., Grilled Salmon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe-desc">Description</Label>
            <Textarea
              id="recipe-desc"
              placeholder="Brief description..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recipe-servings">Servings</Label>
              <Input
                id="recipe-servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-prep">Prep (min)</Label>
              <Input
                id="recipe-prep"
                type="number"
                placeholder="15"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-cook">Cook (min)</Label>
              <Input
                id="recipe-cook"
                type="number"
                placeholder="30"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipe-difficulty">Difficulty</Label>
              <Select
                id="recipe-difficulty"
                options={difficultyOptions}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-url">Source URL</Label>
              <Input
                id="recipe-url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredients</Label>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Name"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Amt"
                    value={String(ing.amount)}
                    onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                    className="w-16"
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    className="w-20"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeIngredient(i)}
                    className="shrink-0 text-slate-400 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={addIngredient} className="gap-1 text-teal-400">
              <Plus className="h-3.5 w-3.5" /> Add Ingredient
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions</Label>
            <div className="space-y-2">
              {instructions.map((ins, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                    {i + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${i + 1}...`}
                    rows={1}
                    value={ins.text}
                    onChange={(e) => updateInstruction(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeInstruction(i)}
                    className="shrink-0 text-slate-400 hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={addInstruction} className="gap-1 text-teal-400">
              <Plus className="h-3.5 w-3.5" /> Add Step
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isEdit && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={deleteRecipe.isPending}
              className="gap-2 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={!title.trim()}
            className="gap-2"
          >
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? "Save Recipe" : "Add Recipe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
