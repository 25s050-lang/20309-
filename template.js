// [추가 학습/변경] HTML 템플릿 모듈화 및 3차시 입력 폼/집계 표 화면 구성
module.exports = {
  mainHTML: function (listRows, summaryRows) {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>SmartPack - 가방 체크리스트 & 요일별 집계</title>
        <style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.6; background-color: #f8f9fa; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1, h2 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 25px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          .summary-table th { background-color: #2196F3; }
          .checked { text-decoration: line-through; color: #888; background-color: #f9f9f9; }
          form { background: #f1f1f1; padding: 15px; border-radius: 5px; margin-bottom: 25px; }
          input, select, button { padding: 8px; margin: 5px; }
          button { background-color: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 3px; }
          .del-btn { background-color: #f44336; padding: 6px 10px; text-decoration: none; color: white; border-radius: 3px; font-size: 12px; }
          
          /* [추가 디자인] 수정(토글) 버튼 스타일 */
          .btn-check { background-color: #2196F3; font-size: 12px; padding: 5px 8px; }
          .btn-uncheck { background-color: #ff9800; font-size: 12px; padding: 5px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎒 SmartPack 요일별 가방 체크리스트</h1>
        
          <!-- 1. 준비물 및 체크리스트 등록 폼 (Create) -->
          <h2>➕ 새 준비물 추가하기</h2>
          <form action="/create_process" method="post">
            <input type="text" name="name" placeholder="이름 (예: 송지후)" required>
            <input type="text" name="title" placeholder="준비물 (예: 노트북)" required>
            <input type="text" name="category" placeholder="카테고리 (예: 전자기기)" required>
            <select name="day" required>
              <option value="월요일">월요일</option>
              <option value="화요일">화요일</option>
              <option value="수요일">수요일</option>
              <option value="목요일">목요일</option>
              <option value="금요일">금요일</option>
            </select>
            <button type="submit">추가</button>
          </form>

          <!-- 2. 요일별 집계 요약 표 (Read + GROUP BY) -->
          <h2>📊 요일별 준비물 개수 요약</h2>
          <table class="summary-table">
            <tr>
              <th>요일</th>
              <th>총 준비물 개수</th>
              <th>챙긴 개수(완료)</th>
            </tr>
            ${summaryRows}
          </table>

          <!-- 3. 전체 체크리스트 목록 및 상태변경/삭제 (Read, Update, Delete) -->
          <h2>📋 전체 체크리스트 목록</h2>
          <table>
            <tr>
              <th>사용자</th>
              <th>요일</th>
              <th>준비물 (카테고리)</th>
              <th>상태</th>
              <th>관리 (수정 / 삭제)</th>
            </tr>
            ${listRows}
          </table>
        </div>
      </body>
      </html>
    `;
  }
};