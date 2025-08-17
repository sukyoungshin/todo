import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import App from "./App";
import { supabase } from "./lib/supabase";

// Supabase 클라이언트 모킹
jest.mock("./lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Todo CRUD operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addTodo", () => {
    it("새로운 할일을 추가할 수 있다", async () => {
      const mockTodo = { id: 1, text: "새로운 할일", completed: false };
      const mockFrom = jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [mockTodo],
            error: null,
          }),
        })),
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      })) as any;

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      await act(async () => {
        render(<App />);
      });

      const input = screen.getByPlaceholderText("새로운 할 일을 입력하세요");
      fireEvent.change(input, { target: { value: "새로운 할일" } });
      fireEvent.submit(input.closest("form")!);
      
      await waitFor(() => {
        expect(screen.getByText("새로운 할일")).toBeInTheDocument();
      });

      expect(supabase.from).toHaveBeenCalledWith("todos");
    });

    it("빈 문자열은 추가되지 않는다", async () => {
      await act(async () => {
        render(<App />);
      });

      // 초기 데이터 로드 호출 횟수 저장
      const initialCalls = jest.mocked(supabase.from).mock.calls.length;

      const input = screen.getByPlaceholderText("새로운 할 일을 입력하세요");
      fireEvent.change(input, { target: { value: "" } });
      fireEvent.submit(input.closest("form")!);

      // from()이 추가로 호출되지 않았는지 확인
      expect(jest.mocked(supabase.from).mock.calls.length).toBe(initialCalls);
    });
  });

  describe("toggleTodo", () => {
    it("할일을 완료 상태로 토글할 수 있다", async () => {
      const mockTodo = { id: 1, text: "할일", completed: false };

      const mockFromReturn = {
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockTodo],
            error: null,
          }),
        }),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
              data: [{ ...mockTodo, completed: true }],
              error: null,
            }),
          })),
        })),
      } as any;
      
      jest.mocked(supabase.from).mockReturnValue(mockFromReturn);

      await act(async () => {
        render(<App />);
      });

      // 할일이 렌더링될 때까지 대기
      await screen.findByText("할일");
      const checkbox = screen.getByRole("checkbox");

      await userEvent.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });

      expect(supabase.from).toHaveBeenCalledWith("todos");
    });
  });

  describe("deleteTodo", () => {
    it("할일을 삭제할 수 있다", async () => {
      const mockTodo = { id: 1, text: "삭제할 할일", completed: false };
      
      jest.mocked(supabase.from).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockTodo],
            error: null,
          }),
        }),
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        })),
      } as any);

      await act(async () => {
        render(<App />);
      });

      // 할일이 렌더링될 때까지 대기
      await screen.findByText("삭제할 할일");
      const deleteButton = screen.getByText("🗑️");

      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText("삭제할 할일")).not.toBeInTheDocument();
      });

      expect(supabase.from).toHaveBeenCalledWith("todos");
    });
  });
});
