'use strict';

// 今日の日付を yyyy-mm-dd にする
function todayString() {
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


  // 各象限を初期化
  quadrantIds.forEach(qid => {
    const area = document.getElementById("task-list-" + qid);
    const storageKey = "tasks-" + qid;

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
      localStorage.setItem(storageKey, JSON.stringify(arr));
    }

    function makeTask(data) {
      const wrap = document.createElement("div");
      wrap.className = "task-item";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.className = "task-checkbox";
      chk.checked = data && data.checked;

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
      const statuses = [
        {v:"not-started", t:"着手前"},
        {v:"in-progress", t:"着手中"},
        {v:"completed", t:"完了"},
        {v:"on-hold", t:"保留"}
      ];
      statuses.forEach(s => {
        const o = document.createElement("option");
        o.value = s.v;
        o.textContent = s.t;
        sel.appendChild(o);
      });
      sel.value = data && data.status ? data.status : "not-started";

      if (data && data.doneDate) wrap.dataset.doneDate = data.doneDate;


      function styleDone(flag) {
        if (flag) {
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

      const initiallyDone = chk.checked || sel.value === "completed";
      styleDone(initiallyDone);

      function setDone(f) {
        if (f) {
          if (!wrap.dataset.doneDate) wrap.dataset.doneDate = todayString();
        } else {
          delete wrap.dataset.doneDate;
        }
        styleDone(f);
        saveTasks();
        ensureEmpty();
        refreshCompleted();
      }

      chk.addEventListener("change", () => setDone(chk.checked));
      sel.addEventListener("change", () => setDone(sel.value === "completed"));
      txt.addEventListener("input", () => {
        saveTasks(); ensureEmpty(); refreshCompleted();
      });
      dl.addEventListener("input", () => {
        saveTasks(); refreshCompleted();
      });

      wrap.appendChild(chk);
      wrap.appendChild(txt);
      wrap.appendChild(dl);
      wrap.appendChild(sel);

      return wrap;
    }

    function ensureEmpty() {
      const items = area.querySelectorAll(".task-item");
      if (items.length === 0) {
        area.appendChild(makeTask());
        return;
      }
      const last = items[items.length - 1];
      if (last.querySelector(".task-name").value.trim() !== "") {
        area.appendChild(makeTask());
      }
    }

    function loadTasks() {
      area.innerHTML = "";
      const saved = localStorage.getItem(storageKey);
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
      ensureEmpty();
    }

    loadTasks();
    quadrants.push({saveTasks,loadTasks,ensureEmpty,area});
  });


  function refreshCompleted() {
    const today = todayString();
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
      navigator.clipboard.writeText(t)
        .then(() => alert("コピーしました"))
        .catch(() => alert("コピーに失敗しました"));
    });
  }

});


// 年度目標の保存
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

// 年度目標の復元
window.addEventListener("DOMContentLoaded", () => {
  for (let i=1; i<=3; i++) {
    const saved = localStorage.getItem("annualTarget" + i);
    if (saved) {
      const d = document.getElementById("display-target" + i);
      if (d) d.textContent = saved;
    }
  }
});
