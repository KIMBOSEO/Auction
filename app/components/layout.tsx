import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}

//방금 만든 저장소를 실제 웹사이트 전체에 적용하는 단계입니다.