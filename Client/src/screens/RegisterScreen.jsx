import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'http://192.168.0.74:3000';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Validación de fortaleza
    const passwordStrength = () => {
        if (password.length === 0) return { strength: 0, color: '#e5e7eb' };
        if (password.length < 6) return { strength: 1, color: '#ef4444' };
        if (password.length < 8) return { strength: 2, color: '#f59e0b' };
        return { strength: 3, color: '#22c55e' };
    };
    const { strength, color } = passwordStrength();

    // Formatea número: (XXX) XXX-XXXX
    const formatPhoneNumber = (text) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    };
    const handlePhoneChange = (text) => setPhone(formatPhoneNumber(text));

    // Enviar registro al servidor
    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        setIsLoading(true);
        try {
            // Envía número sin formato
            const numberphone = phone.replace(/\D/g, '');
            await axios.post(
                `${API_URL}/register`,
                { nombre_completo: name, email, numberphone, password }
            );
            Alert.alert('Éxito', 'Usuario registrado correctamente', [
                { text: 'OK', onPress: () => navigation.replace('LoginScreen') }
            ]);
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Error en el registro');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="bicycle" size={60} color="#22c55e" />
                        </View>
                        <Text style={styles.appName}>CicloNova</Text>
                        <Text style={styles.subtitle}>Únete a la comunidad ciclista</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Crear una cuenta</Text>

                        {/* Nombre */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre completo"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo electrónico"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Teléfono */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Número de teléfono"
                                placeholderTextColor="#9ca3af"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={14}
                            />
                        </View>

                        {/* Contraseña */}
                        <View style={styles.passwordSection}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Contraseña"
                                    placeholderTextColor="#9ca3af"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                            {password.length > 0 && (
                                <View style={styles.passwordStrengthContainer}>
                                    <View style={styles.strengthBars}>
                                        {[1, 2, 3].map(i => (
                                            <View
                                                key={i}
                                                style={[
                                                    styles.strengthBar,
                                                    { backgroundColor: strength >= i ? color : '#e5e7eb' }
                                                ]}
                                            />
                                        ))}
                                    </View>
                                    <Text style={[styles.strengthText, { color }]}>
                                        {strength === 1 ? 'Débil' : strength === 2 ? 'Media' : 'Fuerte'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Confirmar contraseña */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Confirmar contraseña"
                                placeholderTextColor="#9ca3af"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                            <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                        )}

                        {/* Botón Crear cuenta */}
                        <TouchableOpacity
                            style={[
                                styles.registerButton,
                                (isLoading || (password !== confirmPassword && confirmPassword.length > 0)) && styles.registerButtonDisabled
                            ]}
                            onPress={handleRegister}
                            disabled={isLoading || (password !== confirmPassword && confirmPassword.length > 0)}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.registerButtonText}>Crear cuenta</Text>
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                            <Text style={styles.loginLink}>Inicia sesión aquí</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: '#1f2937',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    passwordSection: {
        marginBottom: 8,
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    strengthBars: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 12,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        marginRight: 4,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '500',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 16,
        marginLeft: 4,
    },
    termsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    termsText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
        flex: 1,
    },
    termsLink: {
        color: '#22c55e',
        fontWeight: '500',
    },
    registerButton: {
        backgroundColor: '#22c55e',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#22c55e',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    registerButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    registerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6b7280',
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    googleButtonText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
    },
    loginLink: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
    },
});