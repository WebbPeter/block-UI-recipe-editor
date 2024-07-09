document.getElementById('renderButton').addEventListener('click', function() {
  const jsonInput = document.getElementById('jsonInput').value;
  try {
    const jsonData = JSON.parse(jsonInput);
    const formattedJson = renderRecipe(jsonData);
    document.getElementById('output').innerHTML = formattedJson;
    renderTimelines(jsonData);
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

function renderTimelines(recipe) {
  const settingsKeys = ['circulation_fan', 'temperature', 'pump_amount', 'light_intensity'];
  settingsKeys.forEach(key => {
    const ctx = document.getElementById(`${key}Chart`).getContext('2d');
    const data = prepareChartData(recipe, key);
    createChart(ctx, data, key);
  });
}

function prepareChartData(recipe, key) {
  const data = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: []
  };

  const settingsData = [];
  let lastSetting = null;
  let lastTime = 0;

  recipe.phases.forEach((phase, phaseIndex) => {
    phase.step.forEach((step, stepIndex) => {
      if (step[key]) {
        step[key].forEach(setting => {
          const hour = setting.start_time[0];
          const minute = setting.start_time[1];
          const time = hour + minute / 60;

          if (lastSetting !== null && lastTime !== time) {
            settingsData.push({ x: lastTime, y: lastSetting });
            settingsData.push({ x: time, y: lastSetting });
          }

          settingsData.push({ x: time, y: setting.setting });
          lastSetting = setting.setting;
          lastTime = time;
        });
      }
    });
  });

  if (lastSetting !== null) {
    settingsData.push({ x: lastTime, y: lastSetting });
    settingsData.push({ x: 24, y: lastSetting });
  }

  data.datasets.push({
    label: key,
    data: settingsData,
    backgroundColor: getColorForKey(key),
    borderColor: getColorForKey(key),
    borderWidth: 1,
    pointRadius: 5,
    pointHoverRadius: 7,
    fill: true
  });

  return data;
}

function createChart(ctx, data, key) {
  const chartType = key === 'pump_amount' ? 'bar' : 'line';

  new Chart(ctx, {
    type: chartType,
    data: data,
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: 24,
          title: {
            display: true,

            text: 'Time (hours)'
          }
        },
        y: {
          title: {
            display: true,
            text: capitalizeFirstLetter(key)
          },
          ticks: {
            callback: function(value, index, values) {
              if (key === 'pump_amount') {
                return `${value} ml`;
              }
              return value;
            }
          },
          stacked: key === 'light_intensity'
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              if (key === 'pump_amount') {
                return `Time: ${context.parsed.x}, Amount: ${context.parsed.y} ml`;
              } else if (key === 'light_intensity') {
                return `Time: ${context.parsed.x}, Intensity: ${context.parsed.y}`;
              }
              return `Time: ${context.parsed.x}, Setting: ${context.parsed.y}`;
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4 // smooth lines
        },
        point: {
          radius: 0 // no points on the line
        }
      }
    }
  });
}

function getColorForKey(key) {
  switch (key) {
    case 'circulation_fan':
      return 'rgba(255, 0, 0, 0.6)'; // red
    case 'temperature':
      return 'rgba(0, 0, 255, 0.6)'; // blue
    case 'pump_amount':
      return 'rgba(0, 255, 0, 0.6)'; // green
    case 'light_intensity':
      return 'rgba(255, 165, 0, 0.6)'; // orange
    default:
      return 'gray';
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}