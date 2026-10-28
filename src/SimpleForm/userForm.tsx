import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Item {
  id: number;
  name: string;
  email: string;
}

export default function UserForm() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch items on load (READ)
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*");
    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  // Add a new item (CREATE)
  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const { error } = await supabase.from("items").insert([{ name, email }]);
    if (error) {
      console.error("Error adding item:", error);
    } else {
      setName("");
      setEmail("");
      fetchItems();
    }
  }

  // Delete an item (DELETE)
  async function deleteItem(id: number) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      console.error("Error deleting item:", error);
    } else {
      fetchItems();
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Supabase Connection Test
        </h1>

        {/* CREATE Form */}
        <form onSubmit={addItem} className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email..."
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
          >
            Add Record
          </button>
        </form>

        {/* READ List / DELETE Action */}
        {loading ? (
          <p className="text-center text-gray-500">Connecting to database...</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500">
            Connected! No records found yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3 rounded"
              >
                <div>
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.email}</p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
