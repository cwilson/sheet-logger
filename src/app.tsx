import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";
import { Layout } from "@/components/layout";
import { DayView } from "@/pages/day-view";
import { WeekView } from "@/pages/week-view";
import { Config } from "@/pages/config";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <DayView /> },
            { path: "week", element: <WeekView /> },
            { path: "config", element: <Config /> },
            { path: "*", element: <Navigate to="/" replace /> },
        ],
    },
]);

export const App = () => <RouterProvider router={router} />;
