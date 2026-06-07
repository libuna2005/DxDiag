import { registerRootComponent } from 'expo';
import App from './App';

// Registering the main root layer programmatically
registerRootComponent(App);

// 🌟 ADD THIS LINE BELOW TO FIX EXPO SNACK'S EXPORT COMPILER ERROR:
export default App;