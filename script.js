document.addEventListener('DOMContentLoaded', function() {
  var workspace = Blockly.inject('blocklyDiv', {
      toolbox: document.getElementById('toolbox')
  });

  Blockly.Blocks['json_object'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("JSON Object")
              .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 15, 15, "*"));
          this.appendStatementInput("PROPERTIES")
              .setCheck(null);
          this.setColour(230);
          this.setTooltip("This block represents a JSON object.");
      }
  };

  Blockly.Blocks['json_property'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("Property")
              .appendField(new Blockly.FieldTextInput("key"), "KEY")
              .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 15, 15, "*"));
          this.appendValueInput("VALUE")
              .setCheck(null)
              .appendField("Value");
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setColour(160);
          this.setTooltip("This block represents a property in a JSON object.");
      }
  };

  Blockly.Blocks['json_value'] = {
      init: function() {
          this.appendDummyInput()
              .appendField("Value")
              .appendField(new Blockly.FieldTextInput("value"), "VALUE")
              .appendField(new Blockly.FieldImage("https://www.gstatic.com/codesite/ph/images/star_on.gif", 15, 15, "*"));
          this.setOutput(true, null);
          this.setColour(120);
          this.setTooltip("This block represents a value for a property in a JSON object.");
      }
  };

  Blockly.JavaScript['json_object'] = function(block) {
      var statements_properties = Blockly.JavaScript.statementToCode(block, 'PROPERTIES');
      var code = '{\n' + statements_properties + '\n}';
      return code;
  };

  Blockly.JavaScript['json_property'] = function(block) {
      var text_key = block.getFieldValue('KEY');
      var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
      var code = '"' + text_key + '": ' + value_value + ',\n';
      return code;
  };

  Blockly.JavaScript['json_value'] = function(block) {
      var text_value = block.getFieldValue('VALUE');
      var code = '"' + text_value + '"';
      return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  document.getElementById('renderButton').addEventListener('click', function() {
      const jsonInput = document.getElementById('jsonInput').value;
      try {
          const jsonData = JSON.parse(jsonInput);
          renderJsonToBlocks(jsonData);
      } catch (error) {
          document.getElementById('output').innerHTML = 'Invalid JSON';
      }
  });

  document.getElementById('saveButton').addEventListener('click', function() {
      const json = blocksToJson();
      if (json) {
          localStorage.setItem('recipeJson', JSON.stringify(json, null, 2));
          alert('JSON saved successfully!');
      } else {
          alert('Invalid JSON');
      }
  });

  document.getElementById('downloadButton').addEventListener('click', function() {
      const json = blocksToJson();
      const fileName = document.getElementById('fileNameInput').value || 'recipe.json';
      if (json) {
          const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      } else {
          alert('Invalid JSON');
      }
  });

  function renderJsonToBlocks(json) {
      workspace.clear();
      // Implementation to convert JSON to blocks goes here
      // This will involve parsing the JSON and adding blocks to the workspace
  }

  function blocksToJson() {
      try {
          const code = Blockly.JavaScript.workspaceToCode(workspace);
          return JSON.parse(code.replace(/,\s*\n}/, '\n}'));
      } catch (error) {
          return null;
      }
  }
});
