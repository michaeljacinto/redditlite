import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useField } from "formik";
import React, { InputHTMLAttributes } from 'react';

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    placeholder: string;
    name: string; // makes it required
}; // want input field to take any props any regular input field would take


export const InputField: React.FC<InputFieldProps> = ({
    label,
    size: _,
    ...props
}) => {
    const [field, { error, }] = useField(props);

    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            <Input {...field} {...props} id={field.name} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
}