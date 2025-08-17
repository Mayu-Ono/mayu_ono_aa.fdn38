'use strict';

// 今日の日付を yyyy-mm-dd で返す関数
function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" +
         String(d.getMonth() + 1).padStart(2, "0") + "-" +
         String(d.getDate()).padStart(2, "0");
}

document.addEventListener("DOMContentLoaded", () => {

  const quadrantIds = ["q1","q2","q3","q4"];
  const quadrants = [];

  const completedBox = document.getElementById("completed");
  const copyBtn = document.getElementById("copyButton");

  // 各象限ごとにセットアップ
  quadrantIds.forEach(qid => {
    const area = document.getElementById("task-list-" + qid);
    const key = "tasks-" + qid;

    // タスクを保存
    function saveTasks() {
      const arr = [];
      area.querySelectorAll(".task-item").forEach(div => {
        arr.push({
          name: div.querySelector(".task-name").value,
          deadline: div.querySelector(".task-deadline").value,
          checked: div.querySelector(".task-checkbox").checked,
          status: div.querySelector(".task-status").value,
          doneDate: div.dataset.doneDate || null
        });
      });
      localStorage.setItem(key, JSON.stringify(arr));
    }

    // タスク要素を生成
    function makeTask(data) {
      const wrap = document.createElement("div");
      wrap.className = "task-item";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "task-checkbox";
      chk.checked = data && data.checked ? true : false;

      const txt = document.createElement("input");
      txt.type = "text";
      txt.className = "task-name";
      txt.placeholder = "タスク名";
      txt.value = data && data.name ? data.name : "";

      const dl = document.createElement("input");
      dl.type = "date";
      dl.className = "task-deadline";
      dl.value = data && data.deadline ? data.deadline : "";

      const sel = document.createElement("select");
      sel.className = "task-status";
      ["着手前","着手中","完了","保留"].forEach((label,i) => {
        const opt = document.createElement("option");
        const vals = ["not-started","in-progress","completed","on-hold"];
        opt.value = vals[i];
        opt.textContent = label;
        sel.appendChild(opt);
      });
      sel.value = (data && data.status) ? data.status : "not-started";

      // 完了済みデータがあれば反映
      if (data && data.doneDate) {
        wrap.dataset.doneDate = data.doneDate;
      }

      // 見た目を完了スタイルにする関数
      function applyDoneStyle(flg) {
        if (flg) {
          txt.classList.add("task-completed");
          dl.classList.add("task-completed");
          sel.classList.add("task-completed");
          sel.value = "completed";
          sel.disabled = true;
          chk.checked = true;
        } else {
          txt.classList.remove("task-completed");
          dl.classList.remove("task-completed");
          sel.classList.remove("task-completed");
          if (sel.value === "completed") sel.value = "not-started";
          sel.disabled = false;
        }
      }

      // 初期状態反映
      applyDoneStyle(chk.checked || sel.value === "completed");

      // 完了状態切替時の処理
      function setDone(flg) {
        if (flg) {
          if (!wrap.dataset.doneDate) {
            wrap.dataset.doneDate = todayStr();
          }
        } else {
          delete wrap.dataset.doneDate;
        }
        applyDoneStyle(flg);
        saveTasks();
        ensureBlankRow();
        refreshCompleted();
      }

      // イベント類
      chk.addEventListener("change", () => setDone(chk.checked));
      sel.addEventListener("change", () => {
        setDone(sel.value === "completed");
      });
      txt.addEventListener("input", () => {
        saveTasks();
        ensureBlankRow();
        refreshCompleted();
      });
      dl.addEventListener("input", () => {
        saveTasks();
        refreshCompleted();
      });

      wrap.appendChild(chk);
      wrap.appendChild(txt);
      wrap.appendChild(dl);
      wrap.appendChild(sel);
      return wrap;
    }

    // 空欄行を確保する
    function ensureBlankRow() {
      const items = area.querySelectorAll(".task-item");
      if (items.length === 0) {
        area.appendChild(makeTask());
        return;
      }
      const last = items[items.length-1];
      if (last.querySelector(".task-name").value.trim() !== "") {
        area.appendChild(makeTask());
      }
    }

    // 保存データを読み込む
    function loadTasks() {
      area.innerHTML = "";
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          JSON.parse(saved).forEach(obj => {
            area.appendChild(makeTask(obj));
          });
        } catch(e) {
          area.appendChild(makeTask());
        }
      } else {
        area.appendChild(makeTask());
      }
      ensureBlankRow();
    }

    loadTasks();
    quadrants.push({saveTasks,loadTasks,ensureBlankRow,area});
  });

  // 本日の完了タスクをまとめる
  function refreshCompleted() {
    const today = todayStr();
    const list = [];

    quadrants.forEach(q => {
      q.area.querySelectorAll(".task-item").forEach(div => {
        const nm = div.querySelector(".task-name").value;
        const dl = div.querySelector(".task-deadline").value;
        const st = div.querySelector(".task-status").value;
        const chk = div.querySelector(".task-checkbox").checked;
        const doneDate = div.dataset.doneDate;

        if ((chk || st === "completed") && doneDate === today) {
          let line = nm || "(無題)";
          if (dl) line += "（期限:" + dl + "）";
          list.push(line);
        }
      });
    });

    completedBox.textContent = list.length ? list.join("\n") : "本日完了したタスクはありません。";
  }

  refreshCompleted();

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const t = completedBox.textContent;
      if (!t || t === "本日完了したタスクはありません。") {
        alert("コピーする完了タスクはありません");
        return;
      }
      navigator.clipboard.writeText(t).then(() => {
        alert("コピーしました");
      }).catch(() => {
        alert("コピーに失敗しました");
      });
    });
  }

});

// 年度目標（入力後にボタンで保存）
function saveTarget(num) {
  const inp = document.getElementById("target" + num);
  const disp = document.getElementById("display-target" + num);
  const val = inp.value.trim();
  if (val) {
    disp.textContent = val;
    localStorage.setItem("annualTarget" + num, val);
    inp.value = "";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  for (let i=1; i<=3; i++) {
    const saved = localStorage.getItem("annualTarget" + i);
    if (saved) {
      const d = document.getElementById("display-target" + i);
      if (d) d.textContent = saved;
    }
  }
});
