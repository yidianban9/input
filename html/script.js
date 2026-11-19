/* ============================================================
   项目1 · 科技工作者建言留言板
   交互：字数统计、表单提交演示、清空提示
   ============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("messageForm");
  var message = document.getElementById("message");
  var charCount = document.getElementById("charCount");
  var result = document.getElementById("result");
  var resultNo = document.getElementById("resultNo");
  var resultPassword = document.getElementById("resultPassword");
  var newMessage = document.getElementById("newMessage");
  var toast = document.getElementById("toast");
  var nameInput = document.getElementById("name");
  var toastTimer = null;

  /* ---------- 01. 留言字数统计 ---------- */
  function updateCharCount() {
    if (!message || !charCount) return;
    charCount.textContent = String(message.value.length);
  }

  if (message) {
    message.addEventListener("input", updateCharCount);
    updateCharCount();
  }

  /* ---------- 02. 轻提示 ---------- */
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  /* ---------- 03. 生成演示用的留言编号与查询密码 ---------- */
  function buildMessageNumber() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    var tail = String(Math.floor(1000 + Math.random() * 9000));
    return "CD-" + year + month + day + "-" + tail;
  }

  function buildPassword() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /* ---------- 04. 提交：前端校验通过后展示结果 ---------- */
  if (form) {
    form.addEventListener("submit", function (event) {
      // 这是一个静态演示页面，不把内容发送到服务器
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (resultNo) resultNo.textContent = buildMessageNumber();
      if (resultPassword) resultPassword.textContent = buildPassword();

      if (result) {
        result.hidden = false;
        result.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }

      showToast("表单校验通过，已生成留言编号");
    });
  }

  /* ---------- 05. 清空表单 ---------- */
  if (form) {
    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        updateCharCount();
        if (nameInput) nameInput.focus();
        if (result) result.hidden = true;
        showToast("表单已清空");
      }, 0);
    });
  }

  /* ---------- 06. 继续留言 ---------- */
  if (newMessage) {
    newMessage.addEventListener("click", function () {
      if (result) result.hidden = true;
      if (form) form.reset();
      if (nameInput) nameInput.focus();
    });
  }

  /* ---------- 07. 聚焦时滚入可视区域（移动端） ---------- */
  var fields = form ? form.querySelectorAll("input, select, textarea") : [];
  Array.prototype.forEach.call(fields, function (field) {
    field.addEventListener("focus", function () {
      if (window.innerWidth > 760) return;
      window.setTimeout(function () {
        field.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 220);
    });
  });
})();
