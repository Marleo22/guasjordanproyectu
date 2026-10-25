import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProcedurePage from '@/features/procedure/ProcedurePage'
import ResultPage from '@/features/result/ResultPage'
import DataPage from '@/features/system-input/DataPage'
import SizePage from '@/features/system-size/SizePage'
import { ROUTES } from '@/lib/routes'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.size, element: <SizePage /> },
      { path: ROUTES.data, element: <DataPage /> },
      { path: ROUTES.procedure, element: <ProcedurePage /> },
      { path: ROUTES.result, element: <ResultPage /> },
      { path: '*', element: <Navigate to={ROUTES.size} replace /> },
    ],
  },
])
