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
  recipe.phases.forEach((phase, phaseIndex) => {
    html += `<div class="recipe-phase"><h3>Phase: ${phase.name}</h3>`;
    phase.step.forEach((step, stepIndex) => {
      Object.keys(step).forEach(key => {
        const className = key.replace('_', '-');
        html += `<div class="recipe-step ${className}"><p><strong>${capitalizeFirstLetter(key)}:</strong></p>`;
        step[key].forEach((setting, settingIndex) => {
          html += `<p>Start Time: <input type="text" data-phase="${phaseIndex}" data-step="${stepIndex}" data-key="${key}" data-index="${settingIndex}" class="start-time" value="${setting.start_time.join(', ')}" /></p>`;
          html += `<p>Setting: <input type="text" data-phase="${phaseIndex}" data-step="${stepIndex}" data-key="${key}" data-index="${settingIndex}" class="setting" value="${Array.isArray(setting.setting) ? setting.setting.join(', ') : setting.setting}" /></p>`;
        });
        html += `<button class="add-button" data-phase="${phaseIndex}" data-step="${stepIndex}" data-key="${key}">Add</button>`;
        html += `<button class="remove-button" data-phase="${phaseIndex}" data-step="${stepIndex}" data-key="${key}">Remove</button>`;
        html += `</div>`;
      });
    });
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}

document.getElementById('output').addEventListener('input', function(event) {
  if (event.target.classList.contains('start-time') || event.target.classList.contains('setting')) {
    const phaseIndex = event.target.getAttribute('data-phase');
    const stepIndex = event.target.getAttribute('data-step');
    const key = event.target.getAttribute('data-key');
    const settingIndex = event.target.getAttribute('data-index');
    const jsonInput = document.getElementById('jsonInput').value;
    const jsonData = JSON.parse(jsonInput);
    
    if (event.target.classList.contains('start-time')) {
      jsonData.phases[phaseIndex].step[stepIndex][key][settingIndex].start_time = event.target.value.split(',').map(Number);
    } else if (event.target.classList.contains('setting')) {
      jsonData.phases[phaseIndex].step[stepIndex][key][settingIndex].setting = Array.isArray(jsonData.phases[phaseIndex].step[stepIndex][key][settingIndex].setting) ? event.target.value.split(',').map(Number) : Number(event.target.value);
    }

    document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
  }
});

document.getElementById('output').addEventListener('click', function(event) {
  if (event.target.classList.contains('add-button')) {
    const phaseIndex = event.target.getAttribute('data-phase');
    const stepIndex = event.target.getAttribute('data-step');
    const key = event.target.getAttribute('data-key');
    const jsonInput = document.getElementById('jsonInput').value;
    const jsonData = JSON.parse(jsonInput);
    
    const newSetting = {
      start_time: [0, 0],
      setting: Array.isArray(jsonData.phases[phaseIndex].step[stepIndex][key][0].setting) ? [0, 0, 0, 0] : 0
    };

    jsonData.phases[phaseIndex].step[stepIndex][key].push(newSetting);
    document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
    document.getElementById('renderButton').click();
  }

  if (event.target.classList.contains('remove-button')) {
    const phaseIndex = event.target.getAttribute('data-phase');
    const stepIndex = event.target.getAttribute('data-step');
    const key = event.target.getAttribute('data-key');
    const jsonInput = document.getElementById('jsonInput').value;
    const jsonData = JSON.parse(jsonInput);
    
    jsonData.phases[phaseIndex].step[stepIndex][key].pop();
    document.getElementById('jsonInput').value = JSON.stringify(jsonData, null, 2);
    document.getElementById('renderButton').click();
  }
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
