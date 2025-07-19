import { useEffect, useState } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const updateInputValue = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputValue(e.target.value);

  const addTodo = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert([{ text: inputValue }])
        .select();

      if (error) {
        console.error("Supabase error:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setTodos((prev) => [data[0], ...prev]);
      }
      setInputValue("");
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTodo = async (selectedToDoId: number) => {
    try {
      const currentTodo = todos.find((todo) => todo.id === selectedToDoId);
      if (!currentTodo) return;

      const { data, error } = await supabase
        .from("todos")
        .update({ completed: currentTodo?.completed })
        .eq("id", selectedToDoId)
        .select();

      if (error) {
        console.error("Update failed:", error);
        return;
      }

      if (data && data.length > 0) {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === data[0].id ? data[0] : todo))
        );
      }
    } catch (error) {
      console.error("unexpected error ", error);
    }
  };

  const deleteTodo = async (selectedToDoId: number) => {
    try {
      // Optimistic UI
      const backup = todos;
      setTodos((prev) =>
        prev.filter((todo) => todo.id !== selectedToDoId)
      );

      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", selectedToDoId);

      if (error) {
        console.error("Supabase error:", error.message);
        setTodos(backup); // 롤백
        return;
      }
    } catch (error) {
      console.error("unexpected error : ", error);
    }
  };

  useEffect(() => {
    const fetchAllTodos = async () => {
      try {
        const { data: todos, error } = await supabase
          .from("todos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error.message);
          return;
        }

        setTodos(todos || []);
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };
    fetchAllTodos();
  }, []);

  return (
    <div className="app">
      <main className="todo-container">
        <header className="header">
          <h1>✨ToDo List✨</h1>
          <p className="subtitle">일정을 체계적으로 관리하세요</p>
        </header>
        <form className="input-form" onSubmit={addTodo}>
          <input
            type="text"
            placeholder="새로운 할 일을 입력하세요"
            value={inputValue}
            onChange={updateInputValue}
            className="todo-input"
          />
          <button type="submit" className="add-button">
            추가
          </button>
        </form>
        <div className="todo-list">
          {todos.length > 0 ? (
            todos.map(({ id, text, completed }) => (
              <div
                key={id}
                className={`todo-item ${completed ? "completed" : ""}`}
              >
                <label className="todo-checkbox">
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={() => toggleTodo(id)}
                  />
                  <span className="checkmark"></span>
                </label>
                <span className="todo-text">{text}</span>
                <button
                  onClick={() => deleteTodo(id)}
                  className="delete-button"
                >
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">아직 할 일이 없습니다</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
