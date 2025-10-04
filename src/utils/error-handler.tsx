// 타입 안전한 에러 처리 유틸리티

/**
 * 에러 객체에서 안전하게 메시지를 추출하는 함수
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  
  return String(error) || '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러 로깅을 위한 유틸리티 함수
 */
export function logError(context: string, error: unknown, additionalInfo?: any) {
  console.error(`❌ [${context}]`, {
    message: getErrorMessage(error),
    error,
    additionalInfo,
    timestamp: new Date().toISOString()
  });
}

/**
 * 표준화된 에러 응답 생성
 */
export function createErrorResponse(message: string, error?: unknown) {
  return {
    success: false,
    error: message,
    details: error ? getErrorMessage(error) : undefined,
    timestamp: new Date().toISOString()
  };
}