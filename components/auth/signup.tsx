import { useState } from 'react';
import { Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';

export default function SignUp({ toggleSignIn }: any) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  // start the sign up process.
  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // send the email.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // change the UI to our pending section.
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // This verifies the user using email code that is delivered.
  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace({ pathname: '/lobby' });
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View>
      {!pendingVerification && (
        <>
          <TextInput
            autoCapitalize="none"
            style={styles.input}
            value={emailAddress}
            placeholder="Email..."
            onChangeText={(email) => setEmailAddress(email)}
          />

          <TextInput
            value={password}
            style={styles.input}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />

          <Pressable style={styles.button} onPress={onSignUpPress}>
            <Text style={styles.text}>Sign up</Text>
          </Pressable>

          <Pressable onPress={() => toggleSignIn()}>
            <Text style={styles.link}>
              Already have an account? Sign in here
            </Text>
          </Pressable>
        </>
      )}
      {pendingVerification && (
        <>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Code..."
            onChangeText={(code) => setCode(code)}
          />

          <Pressable style={styles.button} onPress={onPressVerify}>
            <Text style={styles.text}>Verify Email</Text>
          </Pressable>
        </>
      )}
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
