import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from './consts';
//import css
import './App.css';

const calculateModifier = (value) => Math.floor((value - 10) / 2);

function App() {
  const [characters, setCharacters] = useState([]);
  const [rollResults, setRollResults] = useState({});
  const MAX_ATTRIBUTE_POINTS = 70;

  useEffect(() => {
    axios.get('https://recruiting.verylongdomaintotestwith.ca/api/{harshit-malik7}/character')
      .then((response) => {
        console.log('Characters fetched:', response.data);
        const fetchedCharacters = response.data.body.map(character => ({
          name: character.name,
          attributes: {
            Strength: character.attributes.Strength || 10,
            Dexterity: character.attributes.Dexterity || 10,
            Constitution: character.attributes.Constitution || 10,
            Intelligence: character.attributes.Intelligence || 10,
            Wisdom: character.attributes.Wisdom || 10,
            Charisma: character.attributes.Charisma || 10,
          },
          skills: Object.fromEntries(SKILL_LIST.map(skill => [skill.name, character.skills[skill.name] || 0])),
          skillPoints: character.skillPoints || 10,
        }));
        
        setCharacters(fetchedCharacters);
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  const addCharacter = () => {
    const newCharacter = {
      name: `Character ${characters.length + 1}`,
      attributes: {
        Strength: 10,
        Dexterity: 10,
        Constitution: 10,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 10,
      },
      skills: Object.fromEntries(SKILL_LIST.map(skill => [skill.name, 0])),
      skillPoints: 10,
    };

    setCharacters([...characters, newCharacter]);
  };

  const deleteCharacter = (index) => {
    const newCharacters = characters.filter((_, i) => i !== index);
    setCharacters(newCharacters);
  };

  const handleAttributeChange = (index, attribute, change) => {
    const newCharacters = [...characters];
    const totalPoints = Object.values(newCharacters[index].attributes).reduce(
      (total, value) => total + value,
      0
    );

    if (change > 0 && totalPoints >= MAX_ATTRIBUTE_POINTS) {
      alert('Maximum attribute points reached!');
      return;
    }

    const newValue = newCharacters[index].attributes[attribute] + change;
    if (newValue >= 0) {
      newCharacters[index].attributes[attribute] = newValue;
      newCharacters[index].skillPoints =
        10 + 4 * calculateModifier(newCharacters[index].attributes.Intelligence);
      setCharacters(newCharacters);
    }
  };

  const handleSkillChange = (index, skill, change) => {
    const newCharacters = [...characters];
    const character = newCharacters[index];

    const totalSkillPoints = Object.values(character.skills).reduce(
      (total, value) => total + value,
      0
    );
    const skillPointsAvailable = character.skillPoints;

    if (change > 0 && totalSkillPoints >= skillPointsAvailable) {
      alert('No more skill points available!');
      return;
    }

    const newValue = character.skills[skill] + change;
    if (newValue >= 0) {
      character.skills[skill] = newValue;
      setCharacters(newCharacters);
    }
  };

  const handleClassCheck = (character) => {
    return Object.entries(CLASS_LIST).filter(([clsName, minAttributes]) =>
      Object.keys(minAttributes).every(
        attr => character.attributes[attr] >= minAttributes[attr]
      )
    ).map(([clsName]) => clsName);
  };

  const handleSkillCheck = (character, skill, dc) => {
    const randomRoll = Math.floor(Math.random() * 20) + 1;
    const skillTotal =
      character.skills[skill] +
      calculateModifier(character.attributes[SKILL_LIST.find(s => s.name === skill).attributeModifier]);
    const success = randomRoll + skillTotal >= dc;

    return { roll: randomRoll, success };
  };

  const handlePartySkillCheck = (skill, dc) => {
    if (characters.length === 0) {
      alert('No characters available for skill check!');
      return { bestCharacter: null, roll: null, success: false };
    }
  
    const bestCharacter = characters.reduce(
      (best, char) => {
        const charSkillTotal =
          char.skills[skill] +
          calculateModifier(char.attributes[SKILL_LIST.find(s => s.name === skill).attributeModifier]);
        return charSkillTotal > best.total
          ? { char, total: charSkillTotal }
          : best;
      },
      { char: null, total: 0 }
    );
  
    if (!bestCharacter.char) {
      alert('No suitable character found for the skill check!');
      return { bestCharacter: null, roll: null, success: false };
    }
  
    const result = handleSkillCheck(bestCharacter.char, skill, dc);
    return { bestCharacter, ...result };
  };
  

  const handleSave = () => {
    axios.post(`https://recruiting.verylongdomaintotestwith.ca/api/{harshit-malik7}/character`, characters)
      .then((response) => {
        console.log('Data saved:', response.data);
      })
      .catch((error) => console.error('Error saving data:', error));
  };

  return (
    <div className='App'>
      <h1>Character Sheet</h1>
      <button onClick={addCharacter}>Add Character</button>

      {characters.map((character, index) => (
        <div
          key={index}
          className="character-card"
        >
          <h2>{character.name}</h2>
          <button onClick={() => deleteCharacter(index)}>Delete Character</button>

          <div>
            <h3>Attributes</h3>
            {ATTRIBUTE_LIST.map(attr => (
              <div key={attr} className="attribute">
                <span>
                  {attr}: {character.attributes[attr]}
                </span>
                <button onClick={() => handleAttributeChange(index, attr, 1)}>+</button>
                <button onClick={() => handleAttributeChange(index, attr, -1)}>-</button>
                <span> Modifier: {calculateModifier(character.attributes[attr])}</span>
              </div>
            ))}
          </div>

          <div>
            <h3>Skills</h3>
            <p>
              Available skill points:{' '}
              {character.skillPoints - Object.values(character.skills).reduce((a, b) => a + b, 0)}
            </p>
            {SKILL_LIST.map(skill => (
              <div
                key={skill.name}
                className="skill"
              >
                <span>{skill.name}</span>
                <span>Points: {character.skills[skill.name]}</span>
                <button onClick={() => handleSkillChange(index, skill.name, 1)}>+</button>
                <button onClick={() => handleSkillChange(index, skill.name, -1)}>-</button>
                <span>
                  Modifier ({skill.attributeModifier}):{' '}
                  {calculateModifier(character.attributes[skill.attributeModifier])}
                </span>
                <span>
                  Total:{' '}
                  {character.skills[skill.name] +
                    calculateModifier(character.attributes[skill.attributeModifier])}
                </span>
              </div>
            ))}
          </div>

          <div>
            <h3>Classes</h3>
            {handleClassCheck(character).map(cls => (
              <div key={cls}>
                <h4>{cls}</h4>
                <p>Minimum attributes required:</p>
                <ul>
                  {Object.entries(CLASS_LIST[cls]).map(([attr, min]) => (
                    <li key={attr}>
                      {attr}: {min}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h3>Skill Check</h3>
            <input type='number' placeholder='DC' id={`dc-${index}`} />
            <select id={`skill-${index}`}>
              {SKILL_LIST.map(skill => (
                <option key={skill.name} value={skill.name}>
                  {skill.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const skill = document.getElementById(`skill-${index}`).value;
                const dc = parseInt(document.getElementById(`dc-${index}`).value, 10);
                const result = handleSkillCheck(character, skill, dc);
                setRollResults(prev => ({ ...prev, [`roll-${index}`]: result }));
              }}
            >
              Roll
            </button>
            {rollResults[`roll-${index}`] && (
              <div className="roll-result">
                Roll: {rollResults[`roll-${index}`].roll}, Success: {rollResults[`roll-${index}`].success ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </div>
      ))}

      <div>
        <h3>Party Skill Check</h3>
        <input type='number' placeholder='DC' id='party-dc' />
        <select id='party-skill'>
          {SKILL_LIST.map(skill => (
            <option key={skill.name} value={skill.name}>
              {skill.name}
            </option>
          ))}
        </select>
        <button
  onClick={() => {
    const skill = document.getElementById('party-skill').value;
    const dc = parseInt(document.getElementById('party-dc').value, 10);
    
    // Debug log to check if the button click is registered
    console.log(`Rolling Party Check for skill: ${skill}, DC: ${dc}`);
    
    const { bestCharacter, roll, success } = handlePartySkillCheck(skill, dc);
    if (bestCharacter) {
      setRollResults(prev => ({
        ...prev,
        partyRoll: { roll, success, character: bestCharacter.name },
      }));
    } else {
      console.log('No character available for the skill check.');
      alert('No character has the required skill for this check!');
    }
  }}
>
  Roll Party Check
</button>
        {rollResults.partyRoll && (
          <div className="roll-result">
            Best Character: {rollResults.partyRoll.character}, Roll: {rollResults.partyRoll.roll}, Success: {rollResults.partyRoll.success ? 'Yes' : 'No'}
          </div>
        )}
      </div>

      <button onClick={handleSave}>Save Characters</button>
    </div>
  );
}

export default App;
