import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ChatPage } from './features/chat/ChatPage'
import { FoodLibraryPage } from './features/foods/FoodLibraryPage'
import { MealPlanPage } from './features/planning/MealPlanPage'
import { RecipesPage } from './features/planning/RecipesPage'
import { ShoppingListPage } from './features/shopping-list/ShoppingListPage'
import { ProfilePage } from './features/profile/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/foods" element={<FoodLibraryPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/planning" element={<MealPlanPage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
