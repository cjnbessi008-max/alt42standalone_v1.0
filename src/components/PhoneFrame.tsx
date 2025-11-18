import { ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="flex justify-end">
      <div className="relative">
        {/* 스마트폰 프레임 */}
        <div className="relative w-[375px] h-[667px] bg-black rounded-[40px] p-3 shadow-2xl">
          {/* 스크린 */}
          <div className="relative w-full h-full bg-white rounded-[32px] overflow-hidden">
            {/* 상태바 */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 flex items-center justify-between px-6 z-10 text-xs">
              <span>9:41</span>
              <div className="flex gap-1">
                <span>📶</span>
                <span>📡</span>
                <span>🔋</span>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="absolute top-6 left-0 right-0 bottom-0">
              {children}
            </div>
          </div>

          {/* 홈 버튼 */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-[120px] h-1 bg-gray-700 rounded-full"></div>
        </div>

        {/* 라벨 */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-sm text-gray-500 font-medium">
            가상 스마트폰 화면
          </span>
        </div>
      </div>
    </div>
  )
}
