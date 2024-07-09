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
      jsonData.phases[phaseIndex].step[stepIndex][key][settingIndex].setting = Array.isArray(jsonData.phases[phaseIndex].step[stepIndex][key][settingIndex].setting) ? event.target.value.split(', ').map(Number) : Number(event.target.value);
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
  recipe.phases.forEach((phase, phaseIndex) => {
    phase.step.forEach((step, stepIndex) => {
      if (step[key]) {
        step[key].forEach(setting => {
          const hour = setting.start_time[0];
          const minute = setting.start_time[1];
          settingsData.push({ x: hour + minute / 60, y: phaseIndex + stepIndex / 10 });
        });
      }
    });
  });

  data.datasets.push({
    label: key,
    data: settingsData,
    backgroundColor: getColorForKey(key),
    borderColor: getColorForKey(key),
    borderWidth: 1,
    pointRadius: 5,
    pointHoverRadius: 7
  });

  return data;
}

function createChart(ctx, data, key) {
  new Chart(ctx, {
    type: 'scatter',
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
              const settingsKeys = ['Circulation Fan', 'Temperature', 'Pump Amount', 'Light Intensity'];
              return settingsKeys[Math.floor(value)];
            }
          }
        }
      }
    }
  });
}

function getColorForKey(key) {
  switch (key) {
    case 'circulation_fan':
      return 'red';
    case 'temperature':
      return 'blue';
    case 'pump_amount':
      return 'green';
    case 'light_intensity':
      return 'orange';
    default:
      return 'gray';
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Blockly JSON functions for converting JSON to workspace and workspace to JSON

Blockly.JSON = new Object();

Blockly.JSON.fromWorkspace = function(workspace) {
  var blocks = workspace.getTopBlocks(true);
  var json = Blockly.JSON.generalBlockToObj(blocks[0]);
  return JSON.stringify(json, null, 2);
};

Blockly.JSON.generalBlockToObj = function(block) {
  var obj = null;
  switch (block.type) {
    case 'dictionary':
      obj = {};
      var input = block.getInput('ADD');
      var connections = input.connection.targetConnection;
      while (connections) {
        var pairBlock = connections.getSourceBlock();
        var key = pairBlock.getFieldValue('key');
        obj[key] = Blockly.JSON.generalBlockToObj(pairBlock.getInputTargetBlock('value'));
        connections = pairBlock.nextConnection.targetConnection;
      }
      break;
    case 'array':
      obj = [];
      var input = block.getInput('ADD');
      var connections = input.connection.targetConnection;
      while (connections) {
        var valueBlock = connections.getSourceBlock();
        obj.push(Blockly.JSON.generalBlockToObj(valueBlock));
        connections = valueBlock.nextConnection.targetConnection;
      }
      break;
    case 'number':
      obj = Number(block.getFieldValue('number'));
      break;
    case 'string':
      obj = block.getFieldValue('text');
      break;
    case 'true':
      obj = true;
      break;
    case 'false':
      obj = false;
      break;
  }
  return obj;
};

Blockly.JSON.toWorkspace = function(jsonText, workspace) {
  var json = JSON.parse(jsonText);
  var rootBlock = Blockly.JSON.buildAndConnect(json, workspace, null);
  if (rootBlock) {
    rootBlock.render();
  }
};

Blockly.JSON.buildAndConnect = function(obj, workspace, parentBlock) {
  var newBlock = null;
  if (Array.isArray(obj)) {
    newBlock = workspace.newBlock('array');
    for (var i = 0; i < obj.length; i++) {
      var itemBlock = Blockly.JSON.buildAndConnect(obj[i], workspace, newBlock);
      newBlock.getInput('ADD').connection.connect(itemBlock.previousConnection);
    }
  } else if (typeof obj === 'object') {
    newBlock = workspace.newBlock('dictionary');
    for (var key in obj) {
      var pairBlock = workspace.newBlock('keyvaluepair');
      pairBlock.setFieldValue(key, 'key');
      var valueBlock = Blockly.JSON.buildAndConnect(obj[key], workspace, pairBlock);
      pairBlock.getInput('value').connection.connect(valueBlock.outputConnection);
      newBlock.getInput('ADD').connection.connect(pairBlock.previousConnection);
    }
  } else if (typeof obj === 'number') {
    newBlock = workspace.newBlock('number');
    newBlock.setFieldValue(obj, 'number');
  } else if (typeof obj === 'string') {
    newBlock = workspace.newBlock('string');
    newBlock.setFieldValue(obj, 'text');
  } else if (typeof obj === 'boolean') {
    newBlock = workspace.newBlock(obj ? 'true' : 'false');
  }
  if (parentBlock) {
    parentBlock.nextConnection.connect(newBlock.previousConnection);
  }
  return newBlock;
};

// Custom Blockly blocks definitions

Blockly.Blocks['dictionary'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Dictionary");
    this.appendStatementInput("ADD")
        .setCheck("KeyValuePair");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['array'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Array");
    this.appendStatementInput("ADD")
        .setCheck("Value");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['keyvaluepair'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Key")
        .appendField(new Blockly.FieldTextInput("key"), "key");
    this.appendValueInput("value")
        .setCheck("Value")
        .appendField("Value");
    this.setPreviousStatement(true, "KeyValuePair");
    this.setNextStatement(true, "KeyValuePair");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Number")
        .appendField(new Blockly.FieldNumber(0), "number");
    this.setOutput(true, "Value");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("String")
        .appendField(new Blockly.FieldTextInput("text"), "text");
    this.setOutput(true, "Value");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['true'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("True");
    this.setOutput(true, "Value");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['false'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("False");
    this.setOutput(true, "Value");
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
  }
};

// Extending Blockly functionalities

Blockly.Blocks['dictionary'].appendValueInput = function(name) {
  var input = new Blockly.Input(Blockly.DUMMY_INPUT, name, this, 0);
  this.inputList.push(input);
  return input;
};
