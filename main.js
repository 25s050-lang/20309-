const express = require('express');
const app = express();

// POST 요청 Body 파싱을 위한 미들웨어 설정
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;
const mysql = require('mysql2');

// template.js 모듈 불러오기 (수업 코드 외 추가/변경: HTML 템플릿 모듈화)
const template = require('./template.js');

// Aiven 클라우드 MySQL DB 연동 설정 (Connection Pool 사용)
const db = mysql.createPool({
  host: 'mysql-10c85505-sunrin20309.g.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS_1Pq1ha1URzRnS7NuYZo',
  database: 'defaultdb',
  port: 12520,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Aiven DB 커넥션 풀 생성 완료!');

// ==========================================
// 1. READ (조회): 3-Way JOIN + GROUP BY 집계
// ==========================================
app.get('/', (req, res) => {
  // [3-Way LEFT JOIN 쿼리] 3개 테이블(bag, member, thing) 결합
  const joinSql = `
    SELECT 
      b.id AS bag_id,
      m.name AS member_name,
      b.day,
      t.title AS thing_name,
      t.category,
      b.check_yn
    FROM bag b
    LEFT JOIN member m ON b.member_id = m.id
    LEFT JOIN thing t ON b.thing_id = t.id
    ORDER BY b.id ASC;
  `;

  // [집계 쿼리] 생성형 AI 활용: 요일별 총 개수 및 챙김 완료(Y) 개수 계산
  const summarySql = `
    SELECT 
      day, 
      COUNT(*) AS total_count,
      SUM(CASE WHEN check_yn = 'Y' THEN 1 ELSE 0 END) AS checked_count
    FROM bag
    GROUP BY day;
  `;

  // 1차 쿼리 (목록 JOIN) 실행
  db.query(joinSql, (err, listResults) => {
    if (err) return res.status(500).send('JOIN 쿼리 오류: ' + err.message);

    // 2차 쿼리 (집계 GROUP BY) 실행
    db.query(summarySql, (err, summaryResults) => {
      if (err) return res.status(500).send('집계 쿼리 오류: ' + err.message);

      // 전체 목록 HTML 행 생성 (UPDATE 토글 버튼 & DELETE 버튼 포함)
      let listRows = '';
      listResults.forEach(row => {
        const isChecked = row.check_yn === 'Y';
        const statusText = isChecked ? '✅ 완료' : '❌ 미완료';
        const textClass = isChecked ? 'class="checked"' : '';
        const nextStatus = isChecked ? 'N' : 'Y';
        const toggleBtnText = isChecked ? '미완료로 변경' : '완료 처리';
        const toggleBtnClass = isChecked ? 'btn-uncheck' : 'btn-check';

        listRows += `
          <tr ${textClass}>
            <td>${row.member_name || '미정'}</td>
            <td>${row.day || '-'}</td>
            <td>${row.thing_name || '없음'} (${row.category || '-'})</td>
            <td>${statusText}</td>
            <td>
              <!-- [UPDATE 기능] 상태 변경 (Y<->N) 버튼 -->
              <form action="/update_process" method="post" style="display:inline; padding:0; background:none;">
                <input type="hidden" name="id" value="${row.bag_id}">
                <input type="hidden" name="check_yn" value="${nextStatus}">
                <button type="submit" class="${toggleBtnClass}">${toggleBtnText}</button>
              </form>
              <!-- [DELETE 기능] 삭제 버튼 -->
              <a href="/delete_process?id=${row.bag_id}" class="del-btn" onclick="return confirm('정말 삭제하시겠습니까?');">삭제</a>
            </td>
          </tr>
        `;
      });

      // 요일별 집계 HTML 행 생성
      let summaryRows = '';
      summaryResults.forEach(row => {
        summaryRows += `
          <tr>
            <td>${row.day}</td>
            <td>${row.total_count}개</td>
            <td>${row.checked_count}개</td>
          </tr>
        `;
      });

      const html = template.mainHTML(listRows, summaryRows);
      res.send(html);
    });
  });
});

// ==========================================
// 2. CREATE (생성): 회원/소지품/가방 연쇄 추가
// ==========================================
app.post('/create_process', (req, res) => {
  const { name, title, category, day } = req.body;

  db.query('INSERT INTO member (name) VALUES (?)', [name], (err, memberRes) => {
    if (err) return res.status(500).send('1. 회원 등록 오류: ' + err.message);
    const memberId = memberRes.insertId;

    db.query('INSERT INTO thing (title, category) VALUES (?, ?)', [title, category], (err, thingRes) => {
      if (err) return res.status(500).send('2. 소지품 등록 오류: ' + err.message);
      const thingId = thingRes.insertId;

      db.query(
        "INSERT INTO bag (member_id, thing_id, day, check_yn) VALUES (?, ?, ?, 'N')", 
        [memberId, thingId, day], 
        (err) => {
          if (err) return res.status(500).send('3. 가방 등록 오류: ' + err.message);
          res.redirect('/');
        }
      );
    });
  });
});

// ==========================================
// 3. UPDATE (수정): 챙김 상태(check_yn) 변경
// ==========================================
// [추가 학습/변경] 준비물 챙김 상태(Y/N) 수정 기능 추가
app.post('/update_process', (req, res) => {
  const { id, check_yn } = req.body;

  const updateSql = 'UPDATE bag SET check_yn = ? WHERE id = ?';
  db.query(updateSql, [check_yn, id], (err) => {
    if (err) return res.status(500).send('수정 오류: ' + err.message);
    res.redirect('/');
  });
});

// ==========================================
// 4. DELETE (삭제): 체크리스트 항목 삭제
// ==========================================
app.get('/delete_process', (req, res) => {
  const bagId = req.query.id;
  
  db.query('DELETE FROM bag WHERE id = ?', [bagId], (err) => {
    if (err) return res.status(500).send('삭제 오류: ' + err.message);
    res.redirect('/');
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`🚀 3차시 통합 서버 실행 중: http://localhost:${port}`);
});