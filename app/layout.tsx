import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import QueryProvider from "./Providers/QueryProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <QueryProvider>
        <AuthProvider>
          {children}
          <ToastContainer position="bottom-center" autoClose={3000} />
        </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
