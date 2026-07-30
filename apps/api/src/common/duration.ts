/**
 * ms 스타일 기간 문자열. ms@2.1.3이 StringValue 타입을 export 하지 않아
 * (번들 타입/@types/ms 부재) 로컬로 해결 가능한 타입으로 정의한다.
 */
export type StringValue = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
