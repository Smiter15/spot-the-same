import { useState } from 'react';
import { Text, TextInput, Pressable, View, StyleSheet } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export default function SignIn({ toggleSignIn }: any) {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // This is an important step,
      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <View>
      <TextInput
        autoCapitalize="none"
        style={styles.input}
        value={emailAddress}
        placeholder="Email..."
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
      />

      <TextInput
        value={password}
        style={styles.input}
        placeholder="Password..."
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />

      <Pressable style={styles.button} onPress={onSignInPress}>
        <Text style={styles.text}>Sign in</Text>
      </Pressable>

      <Pressable onPress={() => toggleSignIn()}>
        <Text style={styles.link}>Don't have an account? Sign up here</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
  },
  input: {
    width: 250,
    height: 44,
    padding: 10,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#e8e8e8',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  link: {
    marginTop: 10,
    color: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
