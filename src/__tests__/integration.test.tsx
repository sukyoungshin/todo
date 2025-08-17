import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import App from "../App";
import { supabase } from "../lib/supabase";

// Supabase 클라이언트 모킹
jest.mock("../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Todo App Integration Tests", () => {
  describe("전체 할일 관리 워크플로우", () => {
    it("할일 추가, 완료 체크, 삭제가 순차적으로 정상 동작한다", async () => {
      const mockTodos: { id: number; text: string; completed: boolean; }[] = [];
      
      // Supabase 메서드 모킹
      const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockImplementation(async () => ({
            data: mockTodos,
            error: null,
          })),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockImplementation(() => ({
            data: [{ id: 1, text: "통합 테스트용 할일", completed: false }],
            error: null,
          })),
        }),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn().mockResolvedValue({
              data: [{ id: 1, text: "통합 테스트용 할일", completed: true }],
              error: null,
            }),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockImplementation(async () => {
            mockTodos.length = 0;
            return { error: null };
          }),
        })),
      })) as any;

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      // 앱 렌더링
      await act(async () => {
        render(<App />);
      });

      // 1. 할일 추가
      const input = screen.getByPlaceholderText("새로운 할 일을 입력하세요");
      await userEvent.type(input, "통합 테스트용 할일");
      const addButton = screen.getByText("추가");
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText("통합 테스트용 할일")).toBeInTheDocument();
      });

      // 2. 할일 완료 체크
      const checkbox = screen.getByRole("checkbox");
      await userEvent.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });

      // 3. 할일 삭제
      const deleteButton = screen.getByText("🗑️");
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText("통합 테스트용 할일")).not.toBeInTheDocument();
      });
    });
  });

  describe("데이터 지속성", () => {
    it("페이지 리로드 후에도 할일 목록이 유지된다", async () => {
      const mockTodo = { id: 1, text: "지속성 테스트용 할일", completed: false };
      
      // 초기 데이터가 있는 상태를 시뮬레이션
      const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockTodo],
            error: null,
          }),
        }),
      })) as any;

      jest.mocked(supabase.from).mockImplementation(mockFrom);

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText("지속성 테스트용 할일")).toBeInTheDocument();
      });

      // 컴포넌트 언마운트
      unmount();
      
      // 다시 마운트하여 페이지 리로드 시뮬레이션
      await act(async () => {
        render(<App />);
      });

      // 데이터가 여전히 존재하는지 확인
      await waitFor(() => {
        expect(screen.getByText("지속성 테스트용 할일")).toBeInTheDocument();
      });
    });
  });
});
