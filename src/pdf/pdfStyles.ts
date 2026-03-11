import { StyleSheet } from '@react-pdf/renderer';

export const commonStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1a1a1a',
  },
  header: {
    fontSize: 9,
    color: '#444',
    marginBottom: 30,
    lineHeight: 1.5,
  },
});
