/* eslint-disable no-console */

// React
import React, { useState, useEffect, useContext } from 'react';

// @mui/material
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

// Frontend
import { sendCommandToMatterbridge } from './sendApiCommand';
import { Connecting } from './Connecting';
import { WebSocketContext } from './WebSocketProvider';
import { UiContext } from './UiProvider';
import { debug } from '../App';

function Settings() {
  // WebSocket context
  const { online, addListener, removeListener, sendMessage } = useContext(WebSocketContext);

  const [matterbridgeInfo, setMatterbridgeInfo] = useState({});

  useEffect(() => {
    const handleWebSocketMessage = (msg) => {
      if (msg.src === 'Matterbridge' && msg.dst === 'Frontend') {
        if (msg.method === 'refresh_required') {
          if(debug) console.log('Settings received refresh_required');
          sendMessage({ method: "/api/settings", src: "Frontend", dst: "Matterbridge", params: {} });
        }
        if (msg.method === '/api/settings') {
          if(debug) console.log('Settings received /api/settings:', msg.response);
          setMatterbridgeInfo(msg.response.matterbridgeInformation);
        }
      }
    };

    addListener(handleWebSocketMessage);
    if(debug) console.log('Settings added WebSocket listener');
    return () => {
      removeListener(handleWebSocketMessage);
      if(debug) console.log('Settings removed WebSocket listener');
    };
  }, [addListener, removeListener, sendMessage]);

  useEffect(() => {
    if(online) {
      if(debug) console.log('Settings received online');
      sendMessage({ method: "/api/settings", src: "Frontend", dst: "Matterbridge", params: {} });
    }
  }, [online, sendMessage]);

  if(debug) console.log('Settings rendering...');
  if (!online) {
    return ( <Connecting /> );
  }
  return (
    <div className="MbfPageDiv">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
        <MatterbridgeSettings matterbridgeInfo={matterbridgeInfo}/>
        <MatterSettings matterbridgeInfo={matterbridgeInfo}/>
        <MatterbridgeInfo matterbridgeInfo={matterbridgeInfo}/>
      </div>  
    </div>
  );
}

function MatterbridgeSettings({ matterbridgeInfo }) {
  const [selectedBridgeMode, setSelectedBridgeMode] = useState('bridge'); 
  const [selectedMbLoggerLevel, setSelectedMbLoggerLevel] = useState('Info'); 
  const [logOnFileMb, setLogOnFileMb] = useState(false);
  const [password, setPassword] = useState('');
  const [frontendTheme, setFrontendTheme] = useState('dark');

  // Ui context
  const { showSnackbarMessage } = useContext(UiContext);

  useEffect(() => {
    if (matterbridgeInfo.bridgeMode === undefined) return;
    
    setSelectedBridgeMode(matterbridgeInfo.bridgeMode==='bridge'?'bridge':'childbridge'); 

    setSelectedMbLoggerLevel(matterbridgeInfo.loggerLevel.charAt(0).toUpperCase() + matterbridgeInfo.loggerLevel.slice(1));

    setLogOnFileMb(matterbridgeInfo.fileLogger);

  }, [matterbridgeInfo]);

  // Retrieve the saved theme value from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('frontendTheme');
    if (savedTheme) {
      setFrontendTheme(savedTheme);
    }
  }, []);

  // Define a function to handle change bridge mode 
  const handleChangeBridgeMode = (event) => {
    console.log('handleChangeBridgeMode called with value:', event.target.value);
    setSelectedBridgeMode(event.target.value);
    sendCommandToMatterbridge('setbridgemode', event.target.value);
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change debug level
  const handleChangeMbLoggerLevel = (event) => {
    console.log('handleChangeMbLoggerLevel called with value:', event.target.value);
    setSelectedMbLoggerLevel(event.target.value);
    sendCommandToMatterbridge('setmbloglevel', event.target.value);
  };

  // Define a function to handle change matterbridge log file
  const handleLogOnFileMbChange = (event) => {
    console.log('handleLogOnFileMbChange called with value:', event.target.checked);
    setLogOnFileMb(event.target.checked);
    sendCommandToMatterbridge('setmblogfile', event.target.checked ? 'true' : 'false');
  };

  // Define a function to handle change password
  const handleChangePassword = (event) => {
    console.log('handleChangePassword called with value:', event.target.value);
    setPassword(event.target.value);
    sendCommandToMatterbridge('setpassword', '*'+event.target.value+'*');
  };

  // Define a function to handle change theme
  const handleChangeTheme = (event) => {
    const newTheme = event.target.value;
    console.log('handleChangeTheme called with value:', newTheme);
    setFrontendTheme(newTheme);
    localStorage.setItem('frontendTheme', newTheme);
    document.body.setAttribute("frontend-theme", newTheme);
  };

  return (
    <div className="MbfWindowDiv" style={{ flex: '0 0 auto' }}>
      <div className="MbfWindowHeader">
        <p className="MbfWindowHeaderText">Matterbridge settings</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '0 0 auto' }}>
        <Box sx={{ gap: '10px', margin: '0px', padding: '10px', width: '400px', backgroundColor: 'var(--div-bg-color)', color: 'var(--div-text-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}} id="matterbridgeInfo-mode">Matterbridge mode:</FormLabel>
            <RadioGroup row name="mode-buttons-group" value={selectedBridgeMode} onChange={handleChangeBridgeMode}>
              <FormControlLabel value="bridge" control={<Radio />} label="Bridge" />
              <FormControlLabel value="childbridge" control={<Radio />} label="Childbridge" />
            </RadioGroup>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}} id="mblogger-level-label">Logger level:</FormLabel>
            <Select style={{ height: '30px' }} labelId="mblogger-level-label" id="mblogger-level" value={selectedMbLoggerLevel} onChange={handleChangeMbLoggerLevel}>
              <MenuItem value='Debug'>Debug</MenuItem>
              <MenuItem value='Info'>Info</MenuItem>
              <MenuItem value='Notice'>Notice</MenuItem>
              <MenuItem value='Warn'>Warn</MenuItem>
              <MenuItem value='Error'>Error</MenuItem>
              <MenuItem value='Fatal'>Fatal</MenuItem>
            </Select>
            <FormControlLabel style={{padding: '0px', margin: '0px'}} control={<Checkbox checked={logOnFileMb} onChange={handleLogOnFileMbChange} name="logOnFileMb" />} label="Log on file:" labelPlacement="start"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}} id="mb-password-label">Frontend password:</FormLabel>
            <TextField value={password} onChange={handleChangePassword} size="small" id="mb-password" type="password" autoComplete="current-password" variant="outlined" 
              fullWidth
              sx={{ height: '30px', flexGrow: 0 }} 
              InputProps={{ sx: { height: '30px', padding: '0' } }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}} id="frontend-theme-label">Frontend theme:</FormLabel>
            <Select style={{ height: '30px' }} labelId="frontend-theme-label" id="frontend-theme" value={frontendTheme} onChange={handleChangeTheme}>
              <MenuItem value='classic'>Classic</MenuItem>
              <MenuItem value='light'>Light</MenuItem>
              <MenuItem value='dark'>Dark</MenuItem>
            </Select>
          </div>
        </Box>
      </div>
    </div>
  );
}

function MatterSettings({ matterbridgeInfo }) {
  const [selectedMjLoggerLevel, setSelectedMjLoggerLevel] = useState('Info'); 
  const [logOnFileMj, setLogOnFileMj] = useState(false);  
  const [mdnsInterface, setmdnsInterface] = useState('');  
  const [ipv4Address, setIpv4Address] = useState('');  
  const [ipv6Address, setIpv6Address] = useState('');  
  const [matterPort, setMatterPort] = useState();  
  const [matterDiscriminator, setMatterDiscriminator] = useState();  
  const [matterPasscode, setMatterPasscode] = useState();  

  // Ui context
  const { showSnackbarMessage } = useContext(UiContext);

  useEffect(() => {
    if (matterbridgeInfo.bridgeMode === undefined) return;
    setSelectedMjLoggerLevel(['Debug', 'Info', 'Notice', 'Warn', 'Error', 'Fatal'][matterbridgeInfo.matterLoggerLevel]);
    setLogOnFileMj(matterbridgeInfo.matterFileLogger);
    setmdnsInterface(matterbridgeInfo.mattermdnsinterface);
    setIpv4Address(matterbridgeInfo.matteripv4address);
    setIpv6Address(matterbridgeInfo.matteripv6address);
    setMatterPort(matterbridgeInfo.matterPort);
    setMatterDiscriminator(matterbridgeInfo.matterDiscriminator);
    setMatterPasscode(matterbridgeInfo.matterPasscode);
  }, [matterbridgeInfo]);

  // Define a function to handle change debug level
  const handleChangeMjLoggerLevel = (event) => {
    console.log('handleChangeMjLoggerLevel called with value:', event.target.value);
    setSelectedMjLoggerLevel(event.target.value);
    sendCommandToMatterbridge('setmjloglevel', event.target.value);
  };

  // Define a function to handle change matter log file
  const handleLogOnFileMjChange = (event) => {
    console.log('handleLogOnFileMjChange called with value:', event.target.checked);
    setLogOnFileMj(event.target.checked);
    sendCommandToMatterbridge('setmjlogfile', event.target.checked ? 'true' : 'false');
  };

  // Define a function to handle change mdnsInterface
  const handleChangeMdnsInterface = (event) => {
    console.log('handleChangeMdnsInterface called with value:', event.target.value);
    setmdnsInterface(event.target.value);
    sendCommandToMatterbridge('setmdnsinterface', '*'+event.target.value+'*');
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change mdnsInterface
  const handleChangeIpv4Address = (event) => {
    console.log('handleChangeIpv4Address called with value:', event.target.value);
    setIpv4Address(event.target.value);
    sendCommandToMatterbridge('setipv4address', '*'+event.target.value+'*');
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change mdnsInterface
  const handleChangeIpv6Address = (event) => {
    console.log('handleChangeIpv6Address called with value:', event.target.value);
    setIpv6Address(event.target.value);
    sendCommandToMatterbridge('setipv6address', '*'+event.target.value+'*');
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change matterPort
  const handleChangeMatterPort = (event) => {
    console.log('handleChangeMatterPort called with value:', event.target.value);
    setMatterPort(event.target.value);
    sendCommandToMatterbridge('setmatterport', event.target.value);
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change matterDiscriminator
  const handleChangeMatterDiscriminator = (event) => {
    console.log('handleChangeMatterDiscriminator called with value:', event.target.value);
    setMatterDiscriminator(event.target.value);
    sendCommandToMatterbridge('setmatterdiscriminator', event.target.value);
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  // Define a function to handle change matterPasscode
  const handleChangemMatterPasscode = (event) => {
    console.log('handleChangemMatterPasscode called with value:', event.target.value);
    setMatterPasscode(event.target.value);
    sendCommandToMatterbridge('setmatterpasscode', event.target.value);
    showSnackbarMessage('Restart Matterbridge to apply changes', 5);
  };

  return (
    <div className="MbfWindowDiv" style={{ flex: '0 0 auto' }}>
      <div className="MbfWindowHeader">
        <p className="MbfWindowHeaderText">Matter settings</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '0 0 auto' }}>
        <Box sx={{ gap: '10px', margin: '0px', padding: '10px', width: '400px', backgroundColor: 'var(--div-bg-color)', color: 'var(--div-text-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}} id="mjdebug-info">Logger level:</FormLabel>
            <Select style={{ height: '30px' }} labelId="select-mjlevel" id="mjdebug-level" value={selectedMjLoggerLevel} onChange={handleChangeMjLoggerLevel}>
              <MenuItem value='Debug'>Debug</MenuItem>
              <MenuItem value='Info'>Info</MenuItem>
              <MenuItem value='Notice'>Notice</MenuItem>
              <MenuItem value='Warn'>Warn</MenuItem>
              <MenuItem value='Error'>Error</MenuItem>
              <MenuItem value='Fatal'>Fatal</MenuItem>
            </Select>
            <FormControlLabel style={{padding: '0px', margin: '0px'}} control={<Checkbox checked={logOnFileMj} onChange={handleLogOnFileMjChange} name="logOnFileMj" />} label="Log on file:" labelPlacement="start"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Mdns interface:</FormLabel>
            <TextField value={mdnsInterface} onChange={handleChangeMdnsInterface} size="small" variant="outlined" 
              style={{ height: '30px', flexGrow: 1 }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Ipv4 address:</FormLabel>
            <TextField value={ipv4Address} onChange={handleChangeIpv4Address} size="small" variant="outlined" 
              style={{ height: '30px', flexGrow: 1  }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Ipv6 address:</FormLabel>
            <TextField value={ipv6Address} onChange={handleChangeIpv6Address} size="small" variant="outlined"
              style={{ height: '30px', flexGrow: 1 }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Commissioning port:</FormLabel>
            <TextField value={matterPort} onChange={handleChangeMatterPort} size="small" variant="outlined"
              style={{ height: '30px', flexGrow: 1 }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Commissioning discriminator:</FormLabel>
            <TextField value={matterDiscriminator} onChange={handleChangeMatterDiscriminator} size="small" variant="outlined"
              style={{ height: '30px', flexGrow: 1 }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FormLabel style={{padding: '0px', margin: '0px'}}>Commissioning passcode:</FormLabel>
            <TextField value={matterPasscode} onChange={handleChangemMatterPasscode} size="small" variant="outlined"
              style={{ height: '30px', flexGrow: 1 }} InputProps={{
                style: {
                  height: '30px',
                  padding: '0',
                },
              }}/>
          </div>
        </Box>
      </div>
    </div>
  );
}

// <FormControl sx={{ gap: '10px', margin: '0px', padding: '10px', backgroundColor: 'var(--div-bg-color)', color: 'var(--div-text-color)' }}>
function MatterbridgeInfo({ matterbridgeInfo }) {
  return (
    <div className="MbfWindowDiv" style={{ flex: '0 0 auto' }}>
      <div className="MbfWindowHeader">
        <p className="MbfWindowHeaderText">Matterbridge info</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: '0 0 auto' }}>
        <Box sx={{ gap: '10px', margin: '0px', padding: '10px', width: '400px', backgroundColor: 'var(--div-bg-color)', color: 'var(--div-text-color)' }}>          <ReadOnlyTextField value={matterbridgeInfo.matterbridgeVersion} label="Current Version" />
          <ReadOnlyTextField value={matterbridgeInfo.matterbridgeLatestVersion} label="Latest Version" />
          <ReadOnlyTextField value={matterbridgeInfo.homeDirectory} label="Home Directory" />
          <ReadOnlyTextField value={matterbridgeInfo.rootDirectory} label="Root Directory" />
          <ReadOnlyTextField value={matterbridgeInfo.matterbridgeDirectory} label="Matterbridge Storage Directory" />
          <ReadOnlyTextField value={matterbridgeInfo.matterbridgePluginDirectory} label="Matterbridge Plugin Directory" />
          <ReadOnlyTextField value={matterbridgeInfo.globalModulesDirectory} label="Global Module Directory" />
        </Box>
      </div>
    </div>
  );
};

// Define the ReadOnlyTextField component
function ReadOnlyTextField({ value, label }) {
  return (
    <TextField
      focused
      value={value}
      size="small"
      label={label}
      variant="standard"
      sx={{ width: '400px' }}
      InputProps={{
        readOnly: true,
        sx: {
          color: 'var(--div-text-color)',
          '&:before': { borderBottomColor: 'var(--main-label-color)' },
          '&:after': { borderBottomColor: 'var(--main-label-color)' }
        }
      }} 
      InputLabelProps={{
        sx: {
          marginTop: '3px',
          color: 'var(--main-label-color)',
          '&.Mui-focused': {
            color: 'var(--main-label-color)',
          },
        },
      }}
    />
  );
};

export default Settings;
