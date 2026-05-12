const handlePush = async () => {
  if (!currentFilePath) {
    alert("Сначала выберите или создайте файл (кликните по файлу в дереве слева)");
    return;
  }
  if (isImage) {
    alert("Изображения сохраняются через GitHub, но эта кнопка только для кода. Используйте редактор кода.");
    return;
  }
  if (!currentCode || currentCode.trim() === "") {
    alert("Нет кода для сохранения");
    return;
  }

  setIsPushing(true);
  try {
    const res = await fetch("/api/github/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        path: currentFilePath,
        content: currentCode,
        message: `Оракул: обновление ${currentFilePath}`
      }),
    });

    if (res.ok) {
      alert("Материализация успешна!");
      loadRepoTree(); // обновляем дерево файлов
    } else {
      const errorData = await res.json();
      alert(`Ошибка GitHub: ${errorData.error || "Неизвестная ошибка"}`);
    }
  } catch (err: any) {
    alert(`Ошибка сети: ${err.message}`);
  } finally {
    setIsPushing(false);
  }
};
