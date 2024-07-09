document.getElementById('renderButton').addEventListener('click', function() {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    const jsonData = JSON.parse(jsonInput);
    const formattedJson = renderRecipe(jsonData);
    document.getElementById('output').innerHTML = formattedJson;
  } catch (error) {
    document.getElementById('output').innerHTML = 'Invalid JSON';
  }
});

document.getElementById('saveButton').addEventListener('click', function() {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    JSON.parse(jsonInput); // Check if the JSON is valid
    localStorage.setItem('recipeJson', jsonInput);
    alert('JSON saved successfully!');
  } catch (error) {
    alert('Invalid JSON');
  }
});

document.getElementById('downloadButton').addEventListener('click', function() {
  const jsonInput = document.getElementById('jsonInput').value;
  const fileName = document.getElementById('fileNameInput').value || 'recipe.json';
  try {
    JSON.parse(jsonInput); // Check if the JSON is valid
    const blob = new Blob([jsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    alert('Invalid JSON');
  }
});

function renderRecipe(recipe) {
  let html = `<div class="recipe-container">`;
  html += `<div class="recipe-header"><h2>${recipe.recipe_name}</h2></div>`;
  html += `<p><strong>Recipe Variables:</strong> ${recipe.recipe_variable}</p>`;
  recipe.phases.forEach(phase => {
    html += `<div class="recipe-phase"><h3>Phase: ${phase.name}</h3>`;
    phase.step.forEach(step => {
      Object.keys(step).forEach(key => {
        html += `<div class="recipe-step"><p><strong>${capitalizeFirstLetter(key)}:</strong></p>`;
        step[key].forEach(setting => {
          html += `<p>Start Time: ${setting.start_time.join(', ')} - Setting: ${Array.isArray(setting.setting) ? setting.setting.join(', ') : setting.setting}</p>`;
        });
        html += `</div>`;
      });
    });
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
