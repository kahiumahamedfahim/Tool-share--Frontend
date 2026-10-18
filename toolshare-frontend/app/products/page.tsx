
import RoleBasedNavbar from "@/app/components/RoleBasedNavbar";
import ProductList from "./ProductList";

export default function ProductsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <RoleBasedNavbar />
            <ProductList />
        </div>
    );
}
